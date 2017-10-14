'use strict'

const { DuplicateError } = require('../common/error')
const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { imagePath } = require('../common/cache')
const mod = require('../models')
const act = require('../actions')
const { warn, debug } = require('../common/log')
const { prompt } = require('../dialog')


class ImportCommand extends Command {
  *createThumbnails(id, image) {
    try {
      for (let size of [48, 512]) {
        const thumb = yield call([image, image.resize], size)
        yield call(this.options.cache.save,
          imagePath(id, size), thumb.toJPEG(100))
      }
    } catch (error) {
      warn(`Failed to create thumbnail: ${error.message}`)
      debug(error.stack)
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

  setUndo(items) {
    if (items.length) {
      this.undo = act.item.delete(items)
      this.redo = act.item.restore(items)
    }
  }
}


module.exports = {
  ImportCommand
}
