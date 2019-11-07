'use strict'

const assert = require('assert')
const { basename, dirname, join, relative, resolve } = require('path')
const { stat } = require('fs').promises
const { all, call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { ImportCommand } = require('./import')
const { SaveCommand } = require('./subject')
const { fail, open, prompt } = require('../dialog')
const mod = require('../models')
const act = require('../actions')
const { PHOTO } = require('../constants')
const { Image } = require('../image')
const { DuplicateError } = require('../common/error')
const { info, warn } = require('../common/log')
const { blank, pick, pluck, splice } = require('../common/util')

const {
  getPhotoTemplate,
  getPhotosForConsolidation
} = require('../selectors')


class Consolidate extends ImportCommand {
  lookup = async (photo, paths = {}, checkFileSize) => {
    let dir = dirname(photo.path)
    let file = basename(photo.path)

    for (let [from, to] of Object.entries(paths)) {
      let rel = relative(from, dir)

      for (let x of to) {
        try {
          let candidate = join(resolve(x, rel), file)
          let { size } = await stat(candidate)
          let isMatch = !checkFileSize || (size === photo.size)

          if (isMatch) {
            return candidate
          } else {
            info({ path: candidate }, 'skipped consolidation candidate')
          }
        } catch (e) {
          if (e.code !== 'ENOENT') throw e
        }
      }
    }
  }

  *resolve(photo) {
    let { meta } = this.action
    let path = yield call(this.lookup, photo, meta.paths, true)

    if (!path && meta.prompt) {
      try {
        this.suspend()

        let paths = yield call(open.images, {
          properties: ['openFile'],
          message: photo.path
        })
        path = (paths != null) ? paths[0] : null

        if (path) {
          let from = dirname(photo.path)
          let to = dirname(path)

          if (from !== to && basename(photo.path) === basename(path)) {
            let res = yield call(prompt, 'photo.consolidate')
            if (res.ok) {
              yield put(act.photo.consolidate(null, {
                paths: { [from]: [to] }
              }))
            }
          }
        }
      } finally {
        this.resume()
      }
    }

    return path
  }

  *exec() {
    let { payload, meta } = this.action

    let [base, photos, selections, density] = yield select(state => [
      state.project.base,
      getPhotosForConsolidation(state, payload),
      state.selections,
      meta.density || state.settings.density
    ])

    this.consolidated = []

    if (blank(photos))
      return this.consolidated

    yield put(act.photo.bulk.update([
      photos.map(photo => photo.id),
      { consolidating: true }
    ]))

    for (let i = 0, total = photos.length; i < total; ++i) {
      yield put(act.activity.update(this.action, { total, progress: i + 1 }))
      yield* this.consolidate(photos[i], { base, density, selections })
    }

    return this.consolidated
  }

  *consolidate(photo, { base, density, selections }) {
    try {
      let { db } = this.options
      let { meta } = this.action

      let { image, hasChanged, error } =
        yield this.checkPhoto(photo, meta.force)

      let data
      let broken

      if (meta.force || hasChanged) {
        if (error != null) {
          warn({ stack: error.stack }, `failed to open photo ${photo.path}`)

          let path = yield this.resolve(photo)
          if (path) {
            image = yield call(Image.open, {
              density: photo.density || density,
              path,
              page: photo.page,
              protocol: 'file' })
          }
        }

        if (image != null) {
          hasChanged = (image.checksum !== photo.checksum) ||
            (image.path !== photo.path)

          if (meta.force || hasChanged) {
            yield* this.createThumbnails(photo.id, image, {
              overwrite: hasChanged
            })

            for (let id of photo.selections) {
              if (id in selections) {
                yield* this.createThumbnails(id, image, {
                  overwrite: hasChanged,
                  selection: selections[id]
                })
              }
            }

            data = { id: photo.id, ...image.toJSON() }
            broken = false

            yield call(mod.photo.save, db, data, { base })

          } else {
            broken = true
          }

          this.consolidated.push(photo.id)

        } else {
          broken = true
        }
      }

      yield put(act.photo.update({
        id: photo.id,
        broken,
        consolidated: new Date(),
        consolidating: false,
        ...data
      }))

    } catch (e) {
      warn({ stack: e.stack }, `failed to consolidate photo ${photo.id}`)
      fail(e, this.action.type)
    }
  }

  static ACTION = PHOTO.CONSOLIDATE
}


class Create extends ImportCommand {
  static get ACTION() { return PHOTO.CREATE }

  *exec() {
    let { db } = this.options
    let { item, files } = this.action.payload
    let photos = []

    let idx = this.action.meta.idx ||
      [yield select(({ items }) => items[item].photos.length)]

    if (!files) {
      this.isInteractive = true
      files = yield call(open.images)
    }

    if (!files) return []

    let [base, prefs, template] = yield select(state => [
      state.project.base,
      state.settings,
      getPhotoTemplate(state)
    ])


    for (let i = 0, total = files.length; i < files.length; ++i) {
      let file, image, data

      try {
        file = files[i]

        image = yield* this.openImage(file)
        yield* this.handleDuplicate(image)
        data = this.getImageMetadata('photo', image, template, prefs)

        total += (image.numPages - 1)

        while (!image.done) {
          let photo = yield call(db.transaction, tx =>
            mod.photo.create(tx, { base, template: template.id }, {
              item, image, data, position: idx[0] + i + 1
            }))

          yield put(act.metadata.load([photo.id]))

          yield all([
            put(act.photo.insert(photo, { idx: [idx[0] + photos.length] })),
            put(act.activity.update(this.action, { total, progress: i + 1 }))
          ])

          photos.push(photo.id)

          yield* this.createThumbnails(photo.id, image)

          image.next()
        }
      } catch (e) {
        if (e instanceof DuplicateError) continue

        warn({ stack: e.stack }, `failed to import "${file}"`)
        fail(e, this.action.type)
      }
    }

    yield put(act.item.photos.add({ id: item, photos }, { idx }))

    this.undo = act.photo.delete({ item, photos })
    this.redo = act.photo.restore({ item, photos }, { idx })

    return photos
  }
}

class Delete extends Command {
  static get ACTION() { return PHOTO.DELETE }

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
  static get ACTION() { return PHOTO.DUPLICATE }

  *exec() {
    let { db } = this.options
    let { payload } = this.action
    let { item } = payload

    assert(!blank(payload.photos), 'missing photos')

    let [base, order, originals, data, settings] = yield select(state => [
      state.project.base,
      state.items[item].photos,
      pluck(state.photos, payload.photos),
      pluck(state.metadata, payload.photos),
      state.settings
    ])

    let idx = [order.indexOf(payload.photos[0]) + 1]
    let total = originals.length
    let photos = []

    for (let i = 0; i < total; ++i) {
      let { density, template, path, page, protocol } = originals[i]

      try {
        let image = yield call(Image.open, {
          density: density || settings.density,
          path,
          page,
          protocol
        })

        let photo = yield call(db.transaction, tx =>
          mod.photo.create(tx, { base, template }, {
            item,
            image,
            data: data[i]
          }))

        yield put(act.metadata.load([photo.id]))

        yield all([
          put(act.photo.insert(photo, { idx: [idx[0] + photos.length] })),
          put(act.activity.update(this.action, { total, progress: i + 1 }))
        ])

        photos.push(photo.id)
        yield* this.createThumbnails(photo.id, image)

      } catch (e) {
        warn({ stack: e.stack }, `failed to duplicate "${path}"`)
        fail(e, this.action.type)
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
  static get ACTION() { return PHOTO.LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const { project } = yield select()

    const photos = yield call(db.seq, conn =>
      mod.photo.load(conn, payload, project))

    return photos
  }
}

class Move extends Command {
  static get ACTION() { return PHOTO.MOVE }

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
  static get ACTION() { return PHOTO.ORDER }

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
  static get ACTION() { return PHOTO.SAVE }

  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { id, data } = payload

    let [original, project] = yield select(state => [
      pick(state.photos[id], Object.keys(data)),
      state.project
    ])

    const params = { id, timestamp: meta.now, ...data }

    yield call(db.transaction, async tx => {
      await mod.photo.save(tx, params, project)
      await mod.image.save(tx, params)
    })

    this.undo = act.photo.save({ id, data: original })

    if (data.density) {
      this.finally = act.photo.consolidate(id, { force: true })
    }

    return { id, ...data }
  }
}

class Restore extends Command {
  static get ACTION() { return PHOTO.RESTORE }

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

class Rotate extends Command {
  static get ACTION() { return PHOTO.ROTATE }

  *exec() {
    let { db } = this.options
    let { id, by, type = 'photo' } = this.action.payload

    let photos = yield call(mod.image.rotate, db, { id, by })
    yield put(act[type].bulk.update(photos))

    this.undo = act.photo.rotate({ id, by: -by, type })

    return photos
  }
}

class TemplateChange extends SaveCommand {
  static get ACTION() { return PHOTO.TEMPLATE.CHANGE }
  get type() { return 'photo' }
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
  Rotate,
  Save,
  TemplateChange
}
