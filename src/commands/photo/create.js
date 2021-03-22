import { ImportCommand } from '../import'
import { fail } from '../../dialog'
import * as mod from '../../models'
import * as act from '../../actions'
import { PHOTO } from '../../constants'
import { DuplicateError } from '../../common/error'
import { info, warn } from '../../common/log'
import { getPhotoTemplate } from '../../selectors'
import { Image } from '../../image'

import {
  all,
  call,
  fork,
  join as wait,
  put,
  select
} from 'redux-saga/effects'


export class Create extends ImportCommand {
  configure(state) {
    return Object.assign(this.options, {
      base: state.project.basePath,
      template: getPhotoTemplate(state),
      prefs: state.settings,
      idx: this.action.meta?.idx ||
        [state.items[this.action.payload.item].photos.length]
    })
  }

  *exec() {
    // Subtle: push photos to this.result early to support
    // undo after cancelled (partial) import!
    this.result = []
    this.backlog = []

    let files = yield call(this.getFilesToImport)

    if (files.length === 0)
      return this.result

    yield this.progress({ total: files.length })

    this.configure(yield select())

    let maxFail = 15
    let failures = 0

    for (let file of files) {
      try {
        yield* this.importFromFile(file)

      } catch (e) {
        warn({ stack: e.stack }, `failed to import "${file}"`)

        if (++failures < maxFail) {
          fail(e, this.action.type)
        }
      }
    }

    if (this.backlog.length > 0) {
      yield wait(this.backlog)
    }

    return this.result
  }

  *importFromFile(path) {
    try {
      let progress = yield this.progress()

      let { base, cache, db, idx, prefs, store, template } = this.options
      let { item } = this.action.payload

      let image = yield call(Image.open, {
        path,
        density: prefs.density,
        useLocalTimezone: prefs.localtime
      })

      yield* this.handleDuplicate(image)

      let data = this.getImageMetadata('photo', image, template, prefs)
      let ids = []
      let photos = []
      let position = idx[0] + progress

      yield call(store.add, image)

      yield call(db.transaction, async tx => {
        let count = 0

        while (!image.done) {
          let photo = await mod.photo.create(tx,
            { base, template: template.id },
            {
              item,
              image: image.toJSON(),
              data,
              position: position + count++
            })

          ids.push(photo.id)

          photos.push({
            ...photo,
            consolidating: true
          })

          image.next()
        }
      })

      yield all([
        put(act.metadata.load(ids)),
        put(act.photo.insert(photos)),
        put(act.item.photos.add({ id: item, photos: ids }, { idx: [position] }))
      ])

      image.rewind()

      this.backlog.push(
        yield fork(ImportCommand.consolidate,
          cache,
          image,
          ids))

      this.result.push(...ids)

    } catch (e) {
      if (e instanceof DuplicateError)
        info(`skipping duplicate "${path}"...`)
      else
        throw e
    }
  }

  get redo() {
    return !(this.result && this.result.length > 0) ?
      null :
      act.photo.restore({
        item: this.action.payload.item,
        photos: this.result
      }, { idx: this.options.idx })
  }

  get undo() {
    return !(this.result && this.result.length > 0) ?
      null :
      act.photo.delete({
        item: this.action.payload.item,
        photos: this.result
      })
  }
}

Create.register(PHOTO.CREATE)
