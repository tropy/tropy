import { ImportCommand } from '../import.js'
import { fail } from '../../dialog.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { MIME, PHOTO } from '../../constants/index.js'
import { DuplicateError } from '../../common/error.js'
import { info, warn } from '../../common/log.js'
import { getPhotoTemplate } from '../../selectors/index.js'
import { Image } from '../../image/image.js'
import {
  isPdfPortfolio, extractEmbeddedImages
} from '../../image/pdf-portfolio.js'

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

      if (image.mimetype === MIME.PDF &&
        isPdfPortfolio(image.buffer)) {
        let imported = yield * this.importFromPdfPortfolio(image, progress)
        if (imported) return
      }

      if (!optimizeOnImport) {
        yield * this.handleDuplicate(image)
      }

      let data = this.getImageMetadata('photo', image, template, prefs)
      let ids = []
      let photos = []
      let position = idx[0] + progress
      let pageData = []

      if (optimizeOnImport) {
        while (!image.done) {
          let optimized = yield call([image, image.optimize])
          try {
            yield * this.handleDuplicate(image)
            yield call(store.add, image)
            pageData.push({
              ...image.toJSON(),
              ...(optimized ? { page: 0 } : {})
            })
          } catch (err) {
            if (err instanceof DuplicateError) {
              info(`skipping duplicate page ${image.page + 1} of "${path}"...`)
              pageData.push(null)
            } else {
              throw err
            }
          }
          image.next()
        }

        if (pageData.every(p => p == null)) {
          throw new DuplicateError(path)
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

          if (imageData == null) {
            image.next()
            continue
          }

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

  *importFromPdfPortfolio (source, progress) {
    let {
      basePath, cache, db, idx, prefs, store, template, optimizeOnImport
    } = this.options
    let { item } = this.action.payload

    let embedded = extractEmbeddedImages(source.buffer)
    if (!embedded.length) return false

    info(`extracting ${embedded.length} embedded file(s) ` +
      `from pdf portfolio "${source.path}"`)

    let images = []
    for (let { name, data, mimetype } of embedded) {
      try {
        let img = yield call(Image.fromBuffer, {
          buffer: data,
          mimetype,
          filename: name,
          source,
          useLocalTimezone: prefs.localtime
        })
        images.push(img)
      } catch (err) {
        warn({ err, name }, 'skipping unreadable embedded pdf file')
      }
    }

    if (!images.length) return false

    let data = this.getImageMetadata('photo', images[0], template, prefs)
    let imageData = new Array(images.length)

    for (let i = 0; i < images.length; i++) {
      let image = images[i]

      try {
        if (optimizeOnImport && image.mimetype !== MIME.JPG) {
          yield call([image, image.optimize])
        }
        yield * this.handleDuplicate(image)
        yield call(store.add, image)
        imageData[i] = image.toJSON()

      } catch (err) {
        if (err instanceof DuplicateError) {
          info(`skipping duplicate "${image.filename}" in "${source.path}"`)
          imageData[i] = null
        } else {
          throw err
        }
      }
    }

    if (imageData.every(d => d == null))
      throw new DuplicateError(source.path)

    let ids = []
    let photos = []
    let position = idx[0] + progress

    yield call(db.transaction, async tx => {
      let count = 0
      for (let i = 0; i < images.length; i++) {
        if (imageData[i] == null) continue

        let photo = await mod.photo.create(tx,
          { basePath, template: template.id },
          {
            item,
            image: imageData[i],
            data,
            position: position + count++
          })

        ids.push(photo.id)
        photos.push({ ...photo, consolidating: true })
      }
    })

    yield all([
      put(act.metadata.load(ids)),
      put(act.photo.insert(photos)),
      put(act.item.photos.add({ id: item, photos: ids }, { idx: [position] }))
    ])

    let photoIdx = 0
    for (let i = 0; i < images.length; i++) {
      if (imageData[i] == null) continue

      this.backlog.push(
        yield fork(ImportCommand.consolidate, {
          cache,
          image: images[i],
          photos: [ids[photoIdx++]]
        }))
    }

    this.result.push(...ids)
    return true
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
