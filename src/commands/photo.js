'use strict'

const assert = require('assert')
const { all, call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { ImportCommand } = require('./import')
const { fail, open } = require('../dialog')
const mod = require('../models')
const act = require('../actions')
const { PHOTO } = require('../constants')
const { Image } = require('../image')
const { DuplicateError } = require('../common/error')
const { warn } = require('../common/log')
const { blank, pick, pluck, splice } = require('../common/util')
const { getPhotoTemplate, getTemplateValues } = require('../selectors')
const { keys, values } = Object


class Consolidate extends ImportCommand {
  static get action() { return PHOTO.CONSOLIDATE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action
    const consolidated = []

    const photos = yield select(state =>
      blank(payload) ?
        values(state.photos) :
        pluck(state.photos, payload))

    for (let i = 0, total = photos.length; i < total; ++i) {
      const photo = photos[i]

      try {
        let { image, hasChanged, error } = yield call(Image.check, photo, meta)

        if (meta.force || hasChanged) {
          if (error != null) {
            warn(`failed to open photo ${photo.id}`, { stack: error.stack })

            // TODO Figure out where it is!

            if (meta.prompt) {
              this.isInteractive = true
              const paths = yield call(open.images, {
                properties: ['openFile']
              })

              image = (blank(paths)) ?
                null :
                yield call(Image.read, paths[0])
            }
          }

          if (image != null) {
            hasChanged = (image.checksum !== photo.checksum)

            if (meta.force || hasChanged) {
              yield* this.createThumbnails(photo.id, image, {
                overwrite: hasChanged
              })

              const data = { id: photo.id, ...image.toJSON() }

              yield call(mod.photo.save, db, data)
              yield put(act.photo.update({
                broken: false,
                consolidated: new Date(),
                ...data
              }))

            } else {
              yield put(act.photo.update({
                id: photo.id, broken: true, consolidated: new Date()
              }))
            }

            consolidated.push(photo.id)

          } else {
            yield put(act.photo.update({
              id: photo.id, broken: true, consolidated: new Date()
            }))
          }
        }
      } catch (error) {
        warn(`Failed to consolidate photo ${photo.id}`, {
          stack: error.stack
        })

        fail(error, this.action.type)
      }

      yield put(act.activity.update(this.action, { total, progress: i + 1 }))
    }

    return consolidated
  }
}


class Create extends ImportCommand {
  static get action() { return PHOTO.CREATE }

  *exec() {
    const { db } = this.options
    let { item, files } = this.action.payload
    let { idx } = this.action.meta

    const photos = []

    if (idx == null) {
      idx = [yield select(state => state.items[item].photos.length)]
    }

    if (!files) {
      this.isInteractive = true
      files = yield call(open.images)
    }

    if (!files) return []

    const template = yield select(getPhotoTemplate)
    const data = getTemplateValues(template)

    for (let i = 0, total = files.length; i < total; ++i) {
      let file
      let image
      let photo

      try {
        file = files[i]
        image = yield call(Image.read, file)

        yield* this.handleDuplicate(image)

        photo = yield call(db.transaction, tx =>
          mod.photo.create(tx, template.id, {
            item, image, data, position: idx[0] + i + 1
          }))

        yield put(act.metadata.load([photo.id]))

        yield all([
          put(act.photo.insert(photo, { idx: [idx[0] + photos.length] })),
          put(act.activity.update(this.action, { total, progress: i + 1 }))
        ])

        photos.push(photo.id)

        yield* this.createThumbnails(photo.id, image)

      } catch (error) {
        if (error instanceof DuplicateError) continue

        warn(`Failed to import "${file}": ${error.message}`, {
          stack: error.stack
        })

        fail(error, this.action.type)
      }
    }

    yield put(act.item.photos.add({ id: item, photos }, { idx }))

    this.undo = act.photo.delete({ item, photos })
    this.redo = act.photo.restore({ item, photos }, { idx })

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

class Duplicate extends ImportCommand {
  static get action() { return PHOTO.DUPLICATE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const { item } = payload

    assert(!blank(payload.photos), 'missing photos')

    const [order, originals, data] = yield select(state => [
      state.items[item].photos,
      pluck(state.photos, payload.photos),
      pluck(state.metadata, payload.photos)
    ])

    const idx = [order.indexOf(payload.photos[0]) + 1]
    const total = originals.length
    const photos = []

    for (let i = 0; i < total; ++i) {
      const { template, path } = originals[i]

      try {
        const image = yield call(Image.read, path)

        const photo = yield call(db.transaction, tx =>
          mod.photo.create(tx, template, { item, image, data: data[i] }))

        yield put(act.metadata.load([photo.id]))

        yield all([
          put(act.photo.insert(photo, { idx: [idx[0] + photos.length] })),
          put(act.activity.update(this.action, { total, progress: i + 1 }))
        ])

        photos.push(photo.id)
        yield* this.createThumbnails(photo.id, image)

      } catch (error) {
        warn(`Failed to duplicate "${path}": ${error.message}`, {
          stack: error.stack
        })

        fail(error, this.action.type)
      }
    }

    yield call(mod.photo.order, db, item, splice(order, idx[0], 0, ...photos))
    yield put(act.item.photos.add({ id: item, photos }, { idx }))

    this.undo = act.photo.delete({ item, photos })
    this.redo = act.photo.restore({ item, photos }, { idx })

    return photos
  }
}

class Load extends Command {
  static get action() { return PHOTO.LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const photos = yield call(db.seq, conn =>
      mod.photo.load(conn, payload))

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

    yield all([
      put(act.photo.bulk.update([ids, { item }])),
      put(act.item.photos.remove({ id: original.id, photos: ids })),
      put(act.item.photos.add({ id: item, photos: ids }, { idx }))
    ])

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

class Save extends Command {
  static get action() { return PHOTO.SAVE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action
    const { id, data } = payload

    const original = yield select(state =>
      pick(state.photos[id], keys(data)))

    const params = { id, timestamp: meta.now, ...data }

    yield call(db.transaction, async tx => {
      await mod.photo.save(tx, params)
      await mod.image.save(tx, params)
    })

    this.undo = act.photo.save({ id, data: original })

    return { id, ...data }
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

module.exports = {
  Consolidate,
  Create,
  Delete,
  Duplicate,
  Load,
  Move,
  Order,
  Restore,
  Save
}
