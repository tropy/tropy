'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { openImages } = require('../dialog')
const mod = require('../models')
const act = require('../actions')
const { PHOTO } = require('../constants')
const { Image } = require('../image')
const { imagePath } = require('../common/cache')
const { warn, verbose } = require('../common/log')


class Create extends Command {
  static get action() { return PHOTO.CREATE }

  *exec() {
    const { db, cache } = this.options
    let { item, files } = this.action.payload
    const photos = []

    if (!files) {
      files = yield call(openImages)
      this.init = performance.now()
    }

    if (files && files.length) {
      // TODO Improve handling of multiple photos!
      // Progress reporting, cancel import etc.

      for (let file of files) {
        const image = yield call(Image.read, file)

        const photo = yield call([db, db.transaction], tx => (
          mod.photo.create(tx, { item, image })
        ))

        yield put(act.photo.insert(photo))
        photos.push(photo.id)

        try {
          for (let size of [48, 512]) {
            const icon = yield call([image, image.resize], size)
            yield call([cache, cache.save],
              imagePath(photo.id, size), icon.toJPEG(100))
          }

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
    const { payload } = this.action

    const item = yield select(state => state.items[payload.item])

    const photos = payload.photos
    const idx = photos.map(photo => item.photos.indexOf(photo))

    yield put(act.item.photos.remove({ id: item.id, photos }))
    yield call(mod.photo.delete, db, photos)

    this.undo = act.photo.restore({ item: item.id, photos }, { idx })
  }
}

class Restore extends Command {
  static get action() { return PHOTO.RESTORE }

  *exec() {
    const { db } = this.options
    const { item, photos } = this.action.payload

    // Restore all photos in a batch at the former index
    // of the first photo to be restored. Need to differentiate
    // if we support selecting multiple photos!
    const [idx] = this.action.meta.idx

    yield call(mod.photo.restore, db, { item, ids: photos })
    // reorder!
    yield put(act.item.photos.add({ id: item, photos }, { idx }))

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

class Move extends Command {
  static get action() { return PHOTO.MOVE }

  *exec() {
    const { db } = this.options
    const { photos, item } = this.action.payload

    // Assuming all photos being moved from the same item!
    const cur = photos[0].item
    const ids = photos.map(photo => photo.id)

    yield call(mod.photo.move, db, { ids, item })

    yield [
      put(act.photo.bulk.update([ids, { item }])),
      put(act.item.photos.remove({ id: cur, photos: ids })),
      put(act.item.photos.add({ id: item, photos: ids }))
    ]

    this.undo = act.photo.move({
      photos: photos.map(photo => ({ id: photo.id, item })),
      item: cur
    })
  }
}

module.exports = {
  Create,
  Delete,
  Load,
  Restore,
  Move
}
