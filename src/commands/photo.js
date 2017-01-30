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
const { splice } = require('../common/util')


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
    const { item, photos } = this.action.payload

    let order = yield select(state => state.items[item].photos)
    let idx = photos.map(id => order.indexOf(id))

    order = order.filter(id => !photos.includes(id))

    yield call([db, db.transaction], async tx => {
      await mod.photo.delete(tx, photos)
      await mod.photo.order(tx, item, order)
    })

    yield put(act.item.photos.remove({ id: item, photos }))

    this.undo = act.photo.restore({ item, photos }, { idx })
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
    let [idx] = this.action.meta.idx
    let order = yield select(state => state.items[item].photos)

    order = splice(order, idx, 0, ...photos)

    yield call([db, db.transaction], async tx => {
      await mod.photo.restore(tx, { item, ids: photos })
      await mod.photo.order(tx, item, order)
    })

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

    let { idx } = this.action.meta
    let { order, original } = yield select(state => ({
      order: state.items[item].photos,

      // Assuming all photos being moved from the same item!
      original: state.items[photos[0].item]
    }))

    const ids = photos.map(photo => photo.id)

    idx = (idx == null || idx < 0) ? order.length : idx
    order = splice(order, idx, 0, ...ids)

    yield call([db, db.transaction], async tx => {
      await mod.photo.move(tx, { item, ids })
      await mod.photo.order(tx, item, order)
    })

    yield [
      put(act.photo.bulk.update([ids, { item }])),
      put(act.item.photos.remove({ id: original.id, photos: ids })),
      put(act.item.photos.add({ id: item, photos: ids }, { idx }))
    ]

    this.undo = act.photo.move({
      photos: photos.map(({ id }) => ({ id, item })),
      item: original.id
    }, {
      // Restores all photos at the original position of the first
      // of the moved photos. Adjust if we want to support moving
      // arbitrary selections!
      idx: original.photos.indexOf(ids[0])
    })
  }
}

class Order extends Command {
  static get action() { return PHOTO.ORDER }

  *exec() {
    const { db } = this.options
    const { item, photos } = this.action.payload

    const original = yield select(state => state.items[item].photos)

    yield call(mod.photo.order, db, item, photos)
    yield put(act.item.update({ id: item, photos }))

    this.undo = act.photo.order({ item, photos: original })
  }
}


module.exports = {
  Create,
  Delete,
  Load,
  Restore,
  Move,
  Order
}
