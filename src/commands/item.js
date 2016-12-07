'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { prompt, openImages, fail  } = require('../dialog')
const { Image } = require('../image')
const { imagePath } = require('../common/cache')
const { DC } = require('../constants/properties')
const { text } = require('../value')
const intl = require('../selectors/intl')
const act = require('../actions')
const mod = require('../models')

const { ITEM } = require('../constants')

class Create extends Command {
  static get action() { return ITEM.CREATE }

  *exec() {
    const { db } = this.options

    const item = yield call([db, db.transaction], tx => mod.item.create(tx))
    yield put(act.item.insert(item))

    this.undo = act.item.delete([item.id])
    this.redo = act.item.restore([item.id])
  }
}

class Import extends Command {
  static get action() { return ITEM.IMPORT }

  *exec() {
    const { db, cache } = this.options
    let files = this.action.payload

    const items = []
    const metadata = []

    if (!files) {
      files = yield call(openImages)
      this.init = performance.now()
    }

    if (!files) return

    // TODO Improve handling of multiple photos!
    // Progress reporting, cancel import etc.
    for (let file of files) {
      try {
        let item
        let photo
        let image = yield call(Image.read, file)

        yield call([db, db.transaction], async tx => {
          item = await mod.item.create(tx, {
            [DC.TITLE]: text(image.title)
          })
          photo = await mod.photo.create(tx, { item: item.id, image })

          item.photos.push(photo.id)
        })

        try {
          for (let size of [48, 512]) {
            const thumb = yield call([image, image.resize], size)
            yield call([cache, cache.save],
              imagePath(photo.id, size), thumb.toJPEG(100))
          }

        } catch (error) {
          warn(`Failed to create thumbnail: ${error.message}`)
          verbose(error.stack)
        }

        yield put(act.item.insert(item))
        yield put(act.photo.insert(photo))

        items.push(item.id)
        metadata.push(item.id, photo.id)

      } catch (error) {
        warn(`Failed to import photo: ${error.message}`)
        verbose(error.stack)

        fail(error)
      }
    }

    if (items.length) {
      yield put(act.metadata.load(metadata))

      this.undo = act.item.delete(items)
      this.redo = act.item.restore(items)
    }
  }
}

class Delete extends Command {
  static get action() { return ITEM.DELETE }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    yield call(mod.item.delete, db, ids)
    yield put(act.item.bulk.update([ids, { deleted: true }], { search: true }))

    this.undo = act.item.restore(ids)

    return ids
  }
}

class Destroy extends Command {
  static get action() { return ITEM.DESTROY }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    const confirmed = yield call(prompt,
      yield select(intl.message, { id: 'prompt.item.destroy' })
    )

    this.init = performance.now()
    if (!confirmed) return

    try {
      if (ids.length) {
        yield call(mod.item.destroy, db, ids)
        yield put(act.item.remove(ids))

      } else {
        yield call(mod.item.prune, db, false)
        // Remove deleted items
      }

    } finally {
      yield put(act.history.drop(null, { search: true }))
    }
  }
}

class Load extends Command {
  static get action() { return ITEM.LOAD }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    const items = yield call(mod.item.load, db, ids)

    return items
  }
}


class Restore extends Command {
  static get action() { return ITEM.RESTORE }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    yield call(mod.item.restore, db, ids)
    yield put(act.item.bulk.update([ids, { deleted: false }], { search: true }))

    this.undo = act.item.delete(ids)
  }
}

class Save extends Command {
  static get action() { return ITEM.SAVE }

  *exec() {
    const { db } = this.options
    const { id, property, value } = this.action.payload

    const cur = yield select(({ items }) => items[id])
    this.original = { id, property, value: cur[property] }

    yield put(act.item.update(id, { property, value }))
    yield call(mod.item.update, db, { id, property, value })

    this.undo = act.item.save(this.original)
    this.redo = this.action
  }
}

class Merge extends Command {
  static get action() { return ITEM.MERGE }
}

class ToggleTags extends Command {
  static get action() { return ITEM.TAG.TOGGLE }

  *exec() {
    const { db } = this.options
    const { id, tags } = this.action.payload

    const current = yield select(({ items }) => items[id].tags)

    const add = []
    const remove = []

    for (let tag of tags) {
      (current.includes(tag) ? remove : add).push(tag)
    }

    if (add.length) {
      yield call(mod.item.tags.add, db, add.map(tag => ({ id, tag })))
      yield put(act.item.tags.add({ id, tags: add }))
    }

    if (remove.length) {
      yield call(mod.item.tags.remove, db, { id, tags: remove })
      yield put(act.item.tags.remove({ id, tags: remove }))
    }

    this.undo = this.action
  }
}


class ClearTags extends Command {
  static get action() { return ITEM.TAG.CLEAR }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    const tags = yield select(({ items }) => items[id].tags)

    yield call(mod.item.tags.clear, db, id)
    yield put(act.item.tags.remove({ id, tags }))

    this.undo = act.item.tags.toggle({ id, tags })
  }
}

module.exports = {
  Create,
  Delete,
  Destroy,
  Import,
  Load,
  Merge,
  Restore,
  Save,
  ToggleTags,
  ClearTags
}
