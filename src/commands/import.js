'use strict'

const { DuplicateError } = require('../common/error')
const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { imagePath, imageExt } = require('../common/cache')
const mod = require('../models')
const act = require('../actions')
const { warn, verbose } = require('../common/log')
const { prompt } = require('../dialog')


class ImportCommand extends Command {
  *createThumbnails(id, image, {
    overwrite = true,
    quality = 100,
    selection
  } = {}) {
    try {
      let { cache } = this.options
      let ext = imageExt(image.mimetype)

      for (let v of image.variants(selection != null)) {
        let path = imagePath(id, v.name, ext)

        if (overwrite || !(yield call(cache.exists, path))) {
          let dup = image.resize(v.size, selection)

          switch (ext) {
            case '.png':
              dup.png()
              break
            case '.webp':
              dup.webp({
                quality,
                lossless: image.channels === 1 || !(yield call(image.isOpaque))
              })
              break
            default:
              dup.jpeg({ quality })
          }

          yield call([dup, dup.toFile], cache.expand(path))

        } else {
          verbose(`Skipping ${v.name} thumbnail for #${id}: already exists`)
        }
      }
    } catch (error) {
      warn(`Failed to create thumbnail: ${error.message}`, {
        stack: error.stack
      })
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
          const { ok, isChecked } = yield call(prompt.dup, image.path)

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
