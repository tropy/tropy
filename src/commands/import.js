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
  *createThumbnails(id, image, { overwrite = true, quality = 100 } = {}) {
    try {
      const { cache } = this.options
      const ext = imageExt(image.mimetype)

      for (let size of [48, 512]) {
        const path = imagePath(id, size, ext)

        if (overwrite || !(yield call(cache.exists, path))) {
          const dup = yield call(image.resize, size)
          const out = (ext === '.png') ?
            dup.toPNG() :
            dup.toJPEG(quality)

          yield call(this.options.cache.save, path, out)

        } else {
          verbose(`Skipping ${size}px thumbnail for #${id}: already exists`)
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
