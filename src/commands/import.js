'use strict'

const { basename } = require('path')
const { debug, warn } = require('../common/log')
const { DuplicateError } = require('../common/error')
const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const mod = require('../models')
const act = require('../actions')
const { pick } = require('../common/util')
const { prompt } = require('../dialog')
const { Image } = require('../image')
const { DC, TERMS } = require('../constants')
const { date, text } = require('../value')

const {
  getTemplateValues,
  getTemplateProperties
} = require('../selectors')


class ImportCommand extends Command {
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

  *createThumbnails(id, image, {
    overwrite = true,
    selection
  } = {}) {
    try {
      let { cache } = this.options
      let ext = cache.extname(image.mimetype)

      for (let { name, size, quality } of image.variants(selection != null)) {
        let path = cache.path(id, name, ext)

        if (overwrite || !(yield call(cache.exists, path))) {
          let dup = yield call(image.resize, size, selection)

          switch (ext) {
            case '.png':
              dup.png()
              break
            case '.webp':
              dup.webp({
                quality,
                lossless: image.channels === 1 || !image.isOpaque
              })
              break
            default:
              dup.jpeg({ quality })
          }

          yield call([dup, dup.toFile], cache.expand(path))

        } else {
          debug(`skipping ${name} thumbnail for #${id}: already exists`)
        }
      }
    } catch (e) {
      warn({ stack: e.stack }, 'failed to create thumbnail')
    }
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
