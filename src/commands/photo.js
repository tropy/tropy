'use strict'

const assert = require('assert')
const { basename, dirname, join, relative, resolve } = require('path')
const { stat } = require('fs').promises
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
  all,
  call,
  fork,
  join: wait,
  put,
  select
} = require('redux-saga/effects')

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

    let [project, photos, selections, settings] = yield select(state => [
      state.project,
      getPhotosForConsolidation(state, payload),
      state.selections,
      state.settings
    ])

    this.options.base = project.base
    this.options.density = meta.density || settings.density
    this.options.overwrite = true
    this.useLocalTimezone = settings.timezone

    this.consolidated = []

    if (blank(photos))
      return this.consolidated

    yield put(act.photo.bulk.update([
      photos.map(photo => photo.id),
      { consolidating: true }
    ]))

    for (let i = 0, total = photos.length; i < total; ++i) {
      yield put(act.activity.update(this.action, { total, progress: i + 1 }))
      yield this.consolidate(photos[i], selections)
    }

    return this.consolidated
  }

  *consolidate(photo, selections = {}) {
    try {
      let { meta } = this.action
      let { cache, db, overwrite, useLocalTimezone } = this.options
      let density = photo.density || this.options.density

      let {
        image,
        hasChanged,
        error
      } = yield call(Image.check, photo, {
        density,
        useLocalTimezone
      })

      var data
      var broken = (error != null)

      if (meta.force || hasChanged) {
        if (broken) {
          warn({ stack: error.stack }, `failed to open photo ${photo.path}`)

          let path = yield this.resolve(photo)
          if (path) {
            image = yield call(Image.open, {
              density,
              path,
              page: photo.page,
              protocol: 'file',
              useLocalTimezone
            })
          }
        }

        if (image) {
          broken = false
          hasChanged = (image.checksum !== photo.checksum) ||
            (image.path !== photo.path)

          if (meta.force || hasChanged) {
            yield call(cache.consolidate, photo.id, image, {
              overwrite
            })

            for (let id of photo.selections) {
              if (id in selections) {
                yield call(cache.consolidate, id, image, {
                  overwrite,
                  selection: selections[id]
                })
              }
            }

            data = { id: photo.id, ...image.toJSON() }

            yield call(mod.photo.save, db, data, {
              base: this.options.base
            })
          }

          this.consolidated.push(photo.id)
        }
      }

    } catch (e) {
      broken = true

      warn({ stack: e.stack }, `failed to consolidate photo ${photo.id}`)
      fail(e, this.action.type)

    } finally {
      yield put(act.photo.update({
        id: photo.id,
        broken,
        consolidated: Date.now(),
        consolidating: false,
        ...data
      }))
    }
  }
}

Consolidate.register(PHOTO.CONSOLIDATE)


class Create extends ImportCommand {
  *exec() {
    let { cache, db } = this.options
    let { payload, meta } = this.action
    let { item, files } = payload

    let photos = []
    let backlog = []

    let idx = this.action.meta.idx ||
      [yield select(({ items }) => items[item].photos.length)]

    if (!files && meta.prompt)
      files = yield call(this.prompt, meta.prompt)
    if (!files)
      return []

    let [base, template, prefs] = yield select(state => [
      state.project.base,
      getPhotoTemplate(state),
      state.settings
    ])

    // Subtle: push photos to this.result early to support
    // undo after cancelled (partial) import!
    this.result = photos
    this.idx = idx

    for (let i = 0, total = files.length; i < files.length; ++i) {
      let file

      try {
        file = files[i]

        let image = yield* this.openImage(file)
        yield* this.handleDuplicate(image)
        let data = this.getImageMetadata('photo', image, template, prefs)

        total += (image.numPages - 1)
        yield put(act.activity.update(this.action, { total, progress: i + 1 }))

        while (!image.done) {
          let photo = yield call(db.transaction, tx =>
            mod.photo.create(tx, { base, template: template.id }, {
              item,
              image,
              data,
              position: idx[0] + i + 1
            }))

          photo.consolidating = true
          photos.push(photo.id)

          yield all([
            put(act.photo.insert(photo, {
              idx: [idx[0] + photos.length]
            })),
            put(act.metadata.load([photo.id]))
          ])

          image.next()
        }

        image.rewind()

        backlog.push(
          yield fork(ImportCommand.consolidate,
            cache,
            image,
            photos))

      } catch (e) {
        if (e instanceof DuplicateError) {
          info(`skipping duplicate "${file}"...`)
          continue
        }

        warn({ stack: e.stack }, `failed to import "${file}"`)
        fail(e, this.action.type)
      }
    }

    yield put(act.item.photos.add({
      id: item,
      photos
    }, { idx }))

    if (backlog.length > 0) {
      yield wait(backlog)
    }

    return photos
  }

  get redo() {
    return !(this.result && this.result.length > 0) ?
      null :
      act.photo.restore({
        item: this.action.payload.item,
        photos: this.result
      }, { idx: this.idx })
  }

  get undo() {
    return !(this.result && this.result.length > 0) ?
      null :
      act.photo.delete({
        item: this.action.payload.item,
        photos: this.result
      })
  }
}

Create.register(PHOTO.CREATE)


class Delete extends Command {
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

Delete.register(PHOTO.DELETE)


class Duplicate extends ImportCommand {
  *exec() {
    let { cache, db } = this.options
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
        yield call(cache.consolidate, photo.id, image)

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

Duplicate.register(PHOTO.DUPLICATE)


class Load extends Command {
  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const { project } = yield select()

    const photos = yield call(db.seq, conn =>
      mod.photo.load(conn, payload, project))

    return photos
  }
}

Load.register(PHOTO.LOAD)


class Move extends Command {
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

Move.register(PHOTO.MOVE)


class Order extends Command {
  *exec() {
    const { db } = this.options
    const { item, photos } = this.action.payload

    const original = yield select(state => state.items[item].photos)

    yield call(mod.photo.order, db, item, photos)
    yield put(act.item.update({ id: item, photos }))

    this.undo = act.photo.order({ item, photos: original })
  }
}

Order.register(PHOTO.ORDER)


class Save extends Command {
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
      this.after = act.photo.consolidate(id, { force: true })
    }

    return { id, ...data }
  }
}

Save.register(PHOTO.SAVE)


class Restore extends Command {
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

Restore.register(PHOTO.RESTORE)


class Rotate extends Command {
  *exec() {
    let { db } = this.options
    let { id, by, type = 'photo' } = this.action.payload

    let photos = yield call(mod.image.rotate, db, { id, by })
    yield put(act[type].bulk.update(photos))

    this.undo = act.photo.rotate({ id, by: -by, type })

    return photos
  }
}

Rotate.register(PHOTO.ROTATE)


class TemplateChange extends SaveCommand {
  type = 'photo'
}

TemplateChange.register(PHOTO.TEMPLATE.CHANGE)


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
