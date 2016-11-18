'use strict'

const { call, put } = require('redux-saga/effects')
const { Command } = require('./command')
const dialog = require('../dialog')
const mod = require('../models')
const act = require('../actions')
const { PHOTO } = require('../constants')
const { Image } = require('../image')
const { warn, verbose } = require('../common/log')


class Create extends Command {
  static get action() { return PHOTO.CREATE }

  *exec() {
    const { db, cache } = this.options
    let { item, files } = this.action.payload
    const photos = []

    if (!files) {
      files = yield call(dialog.images)
      this.init = performance.now()
    }

    if (files && files.length) {
      // TODO Improve handling of multiple photos! The parsing
      // part can be done in parallel.
      for (let file of files) {
        const image = yield call(Image.read, file)

        const photo = yield call([db, db.transaction], tx => (
          mod.photo.create(tx, { item, image })
        ))

        yield put(act.photo.insert(photo))
        photos.push(photo.id)

        try {
          const icon = yield call([image, image.resize], 48)
          yield call([cache, cache.save],
            `photo-${photo.id}_48.png`, icon.toPNG())

        } catch (error) {
          warn(`Failed to create thumbnail: ${error.message}`)
          verbose(error.stack)
        }
      }

      yield put(act.metadata.load(photos))
      yield put(act.item.photos.add({ id: item, photos }))

      this.undo = act.photo.delete({ item, photos })
      this.redo = act.photo.restore({ item, photos })
    }

    return photos
  }
}

class Delete extends Command {
  static get action() { return PHOTO.DELETE }

  *exec() {
    const { db } = this.options
    const { item, photos } = this.action.payload

    yield put(act.item.photos.remove({ id: item, photos }))
    yield call(mod.photo.delete, db, photos)

    this.undo = act.photo.restore({ item, photos })
  }
}

class Restore extends Command {
  static get action() { return PHOTO.RESTORE }

  *exec() {
    const { db } = this.options
    const { item, photos } = this.action.payload

    // TODO restore positions!

    yield call(mod.photo.restore, db, { item, ids: photos })
    yield put(act.item.photos.add({ id: item, photos }))

    this.undo = act.photo.delete({ item, photos })
  }
}

class Load extends Command {
  static get action() { return PHOTO.LOAD }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    const photos = yield call(mod.photo.load, db, ids)

    return photos
  }
}

module.exports = {
  Create,
  Delete,
  Load,
  Restore
}
