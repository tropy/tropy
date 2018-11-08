'use strict'

const { DuplicateError } = require('../common/error')
const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { imagePath, imageExt } = require('../common/cache')
const mod = require('../models')
const act = require('../actions')
const { warn, verbose } = require('../common/log')
const { prompt } = require('../dialog')
const MIME = require('../constants/mime')


class ImportCommand extends Command {
  *createThumbnails(id, image, { overwrite = true, quality = 100 } = {}) {
    try {
      let { cache } = this.options
      let ext = imageExt(image.mimetype)

      for (let size of SIZE.get(image.mimetype)) {
        let path = imagePath(id, size, ext)

        if (overwrite || !(yield call(cache.exists, path))) {
          let dup = image.resize(SIZE[size])

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
          verbose(`Skipping ${size} thumbnail for #${id}: already exists`)
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

const SIZE = {
  48: {
    width: 48, height: 48, fit: 'cover', position: 'center'
  },

  512: {
    width: 512, height: 512, fit: 'cover', position: 'center'
  },

  get(mimetype) {
    switch (mimetype) {
      case MIME.TIFF:
        return [48, 512, 'full']
      default:
        return [48, 512]
    }
  }
}



module.exports = {
  ImportCommand
}
