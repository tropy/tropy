import { ImportCommand } from '../import.js'
import { fail } from '../../dialog.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'
import { DuplicateError } from '../../common/error.js'
import { info, warn } from '../../common/log.js'
import { getPhotoTemplate } from '../../selectors/index.js'
import { Image } from '../../image/image.js'
import { optimizeImage } from '../../image/optimize.js'
import { Asset } from '../../asset/asset.js'

import {
  all,
  call,
  fork,
  join as wait,
  put,
  select
} from 'redux-saga/effects'


export class Create extends ImportCommand {
  configure (state) {
    return Object.assign(this.options, {
      basePath: state.project.basePath,
      template: getPhotoTemplate(state),
      prefs: state.settings,
      optimizeOnImport: state.project.isManaged &&
        (state.project.optimize?.onImport ?? true),
      idx: this.action.meta?.idx ||
        [state.items[this.action.payload.item].photos.length]
    })
  }

  *exec () {
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
        yield * this.importFromFile(file)

      } catch (err) {
        warn({ err }, `failed to import "${file}"`)

        if (++failures < maxFail) {
          fail(err, this.action.type)
        }
      }
    }

    if (this.backlog.length > 0) {
      yield wait(this.backlog)
    }

    return this.result
  }

  *importFromFile (path) {
    try {
      let progress = yield this.progress()

      let {
        basePath, cache, db, idx, prefs, store, template,
        optimizeOnImport
      } = this.options
      let { item } = this.action.payload

      let image = yield call([Image, Image.open], {
        path,
        density: prefs.density,
        useLocalTimezone: prefs.localtime
      })

      yield * this.handleDuplicate(image)

      let data = this.getImageMetadata('photo', image, template, prefs)
      let ids = []
      let photos = []
      let position = idx[0] + progress
      let pageData = []

      if (optimizeOnImport) {
        while (!image.done) {
          let imageData = image.toJSON()
          let result = yield call(optimizeImage,
            image.buffer,
            { page: image.page, mimetype: image.mimetype, density: prefs.density })

          if (result != null) {
            let optimized = new Asset({
              path: `${result.checksum}${result.ext}`,
              protocol: 'file',
              checksum: result.checksum,
              mimetype: result.mimetype
            })

            optimized.buffer = result.buffer
            yield call(store.add, optimized)

            pageData.push({
              ...imageData,
              path: optimized.path,
              protocol: optimized.protocol,
              checksum: result.checksum,
              mimetype: result.mimetype,
              page: 0
            })
          } else {
            yield call(store.add, image)
            pageData.push({
              ...imageData,
              path: image.path,
              protocol: image.protocol
            })
          }

          image.next()
        }

        image.rewind()
      } else {
        yield call(store.add, image)
      }

      yield call(db.transaction, async tx => {
        let count = 0

        while (!image.done) {
          let imageData = optimizeOnImport
            ? pageData[image.page]
            : image.toJSON()

          let photo = await mod.photo.create(tx,
            { basePath, template: template.id },
            {
              item,
              image: imageData,
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
        yield fork(ImportCommand.consolidate, {
          cache,
          image,
          photos: ids
        }))

      this.result.push(...ids)

    } catch (err) {
      if (err instanceof DuplicateError)
        info(`skipping duplicate "${path}"...`)
      else
        throw err
    }
  }

  get redo () {
    return !(this.result && this.result.length > 0) ?
      null :
      act.photo.restore({
        item: this.action.payload.item,
        photos: this.result
      }, { idx: this.options.idx })
  }

  get undo () {
    return !(this.result && this.result.length > 0) ?
      null :
      act.photo.delete({
        item: this.action.payload.item,
        photos: this.result
      })
  }
}

Create.register(PHOTO.CREATE)
