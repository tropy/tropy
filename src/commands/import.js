'use strict'

const { basename, extname } = require('path')
const { DuplicateError } = require('../common/error')
const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const mod = require('../models')
const act = require('../actions')
const dir = require('../common/dir')
const { pick } = require('../common/util')
const { open, prompt } = require('../dialog')
const { Image } = require('../image')
const { DC, TERMS, IMAGE } = require('../constants')
const { date, text } = require('../value')

const {
  getTemplateValues,
  getTemplateProperties
} = require('../selectors')

const isFileSupported = (file) =>
  IMAGE.EXT.includes(extname(file.name).slice(1).toLowerCase())

class ImportCommand extends Command {
  static *consolidate(cache, image, photos, { overwrite = true } = {}) {
    while (!image.done) {
      let photo = photos[image.page]

      yield call(cache.consolidate, photo, image, {
        overwrite
      })

      yield put(act.photo.update({
        id: photo,
        broken: false,
        consolidated: Date.now(),
        consolidating: false
      }))

      image.next()
    }
  }

  prompt = async (type) => {
    try {
      this.suspend()
      switch (type) {
        case 'dir':
          return dir.expand(await open.dir(), {
            filter: isFileSupported,
            recursive: true
          })
        default:
          return open.images()
      }

    } finally {
      this.resume()
    }
  }

  *openImage(path) {
    let settings = yield select(state => state.settings)

    return yield call(Image.open, {
      path,
      density: settings.density,
      useLocalTimezone: settings.localtime
    })
  }

  *getMetadata(image, templates) {
    let data = {}
    let prefs = yield select(state => state.settings)

    for (let type in templates) {
      data[type] = this.getImageMetadata(type, image, templates[type], prefs)
    }

    return data
  }

  getImageMetadata(type, image, template, prefs) {
    let props = getTemplateProperties(template)
    let data = {
      ...getTemplateValues(template),
      ...pick(image.data, props)
    }

    let title = prefs.title[type]

    if (title != null) {
      if (prefs.title.force || !(title in data)) {
        data[title] = text(image.title)
      }
    }

    if (type === 'photo') {
      if (!(DC.date in data || TERMS.date in data)) {
        data[DC.date] = date(image.date)
      }
    }

    return data
  }

  *isDuplicate(image) {
    return null != (yield call(mod.photo.find, this.options.db, {
      checksum: image.checksum
    }))
  }

  *getDuplicateHandler() {
    if (this.duplicateHandler == null) {
      this.duplicateHandler = yield select(({ settings }) => settings.dup)
    }

    return this.duplicateHandler
  }

  *setDuplicateHandler(handler) {
    this.duplicateHandler = handler
    yield put(act.settings.persist({ dup: handler }))
  }

  *handleDuplicate(image) {
    const handler = yield* this.getDuplicateHandler()
    if (handler === 'import') return

    if (yield* this.isDuplicate(image)) {
      switch (handler) {
        case 'prompt': {
          this.isInteractive = true
          const { ok, isChecked } = yield call(prompt, 'dup', {
            message: basename(image.path)
          })

          if (isChecked) {
            yield* this.setDuplicateHandler(ok ? 'import' : 'skip')
          }

          if (ok) break
        }
        // eslint-disable-next-line no-fallthrough
        case 'skip':
          throw new DuplicateError(image.path)
      }
    }
  }
}

module.exports = {
  ImportCommand
}
