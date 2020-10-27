import { ImportCommand } from '../import'
import { fail } from '../../dialog'
import * as mod from '../../models'
import * as act from '../../actions'
import { PHOTO } from '../../constants'
import { DuplicateError } from '../../common/error'
import { info, warn } from '../../common/log'
import { getPhotoTemplate } from '../../selectors'

import {
  all,
  call,
  fork,
  join as wait,
  put,
  select
} from 'redux-saga/effects'


export class Create extends ImportCommand {
  *exec() {
    let { cache, db } = this.options
    let { payload, meta } = this.action
    let id = payload.item

    let photos = []
    let backlog = []

    let files = yield call(this.getFilesToImport)

    if (files.length === 0)
      return []

    let [base, template, prefs, idx] = yield select(state => [
      state.project.base,
      getPhotoTemplate(state),
      state.settings,
      meta.idx || state.items[id].photos.length
    ])

    // Subtle: push photos to this.result early to support
    // undo after cancelled (partial) import!
    this.result = photos
    this.idx = idx

    for (let i = 0, total = files.length; i < files.length; ++i) {
      let file

      try {
        file = files[i]

        let image = yield* this.openImage(file)
        yield* this.handleDuplicate(image)
        let data = this.getImageMetadata('photo', image, template, prefs)

        total += (image.numPages - 1)
        yield put(act.activity.update(this.action, { total, progress: i + 1 }))

        while (!image.done) {
          let photo = yield call(db.transaction, tx =>
            mod.photo.create(tx, { base, template: template.id }, {
              item: id,
              image: image.toJSON(),
              data,
              position: idx[0] + i + 1
            }))

          photo.consolidating = true
          photos.push(photo.id)

          yield all([
            put(act.photo.insert(photo, {
              idx: [idx[0] + photos.length]
            })),
            put(act.metadata.load([photo.id]))
          ])

          image.next()
        }

        image.rewind()

        backlog.push(
          yield fork(ImportCommand.consolidate,
            cache,
            image,
            photos))

      } catch (e) {
        if (e instanceof DuplicateError) {
          info(`skipping duplicate "${file}"...`)
          continue
        }

        warn({ stack: e.stack }, `failed to import "${file}"`)
        fail(e, this.action.type)
      }
    }

    yield put(act.item.photos.add({ id, photos }, { idx }))

    if (backlog.length > 0) {
      yield wait(backlog)
    }

    return photos
  }

  get redo() {
    return !(this.result && this.result.length > 0) ?
      null :
      act.photo.restore({
        item: this.action.payload.item,
        photos: this.result
      }, { idx: this.idx })
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
