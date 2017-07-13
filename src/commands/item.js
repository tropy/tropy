'use strict'

const assert = require('assert')
const { warn, verbose } = require('../common/log')
const { all, call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { prompt, openImages, fail  } = require('../dialog')
const { Image } = require('../image')
const { imagePath } = require('../common/cache')
const { text } = require('../value')
const intl = require('../selectors/intl')
const act = require('../actions')
const mod = require('../models')
const { get, pluck, pick, remove } = require('../common/util')
const { map, cat, filter, into, compose } = require('transducers.js')
const { ITEM, DC } = require('../constants')
const { keys } = Object
const { isArray } = Array

const {
  getItemTemplate,
  getPhotoTemplate,
  getTemplateValues
} = require('../selectors')


class Create extends Command {
  static get action() { return ITEM.CREATE }

  *exec() {
    const { db } = this.options

    const template = yield select(getItemTemplate)
    const data = getTemplateValues(template)

    const item = yield call(db.transaction, tx =>
      mod.item.create(tx, template.id, data))

    yield put(act.item.insert(item))

    this.undo = act.item.delete([item.id])
    this.redo = act.item.restore([item.id])
  }
}

class Import extends Command {
  static get action() { return ITEM.IMPORT }

  *exec() {
    const { db, cache } = this.options
    let { files, list } = this.action.payload

    const items = []
    const metadata = []

    if (!files) {
      files = yield call(openImages)
      this.init = performance.now()
    }

    if (!files) return

    const [itemp, ptemp] = yield all([
      select(getItemTemplate),
      select(getPhotoTemplate)
    ])

    const idata = getTemplateValues(itemp)
    const pdata = getTemplateValues(ptemp)

    for (let i = 0, ii = files.length; i < ii; ++i) {
      let file, image, item, photo

      try {
        file = files[i]
        image = yield call(Image.read, file)

        yield call(db.transaction, async tx => {
          item = await mod.item.create(tx, itemp.id, {
            [DC.title]: text(image.title), ...idata
          })

          photo = await mod.photo.create(tx, ptemp.id, {
            item: item.id, image, data: pdata
          })

          if (list) {
            await mod.list.items.add(tx, list, [item.id])
            // item.lists.push(list)
          }

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

        yield all([
          put(act.item.insert(item)),
          put(act.photo.insert(photo)),
          put(act.activity.update(this.action, { total: ii, progress: i + 1 }))
        ])

        items.push(item.id)
        metadata.push(item.id, photo.id)

      } catch (error) {
        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)

        fail(error, this.action.type)
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

    const items =
      yield call(db.seq, conn => mod.item.load(conn, ids))

    const { photos } = yield select()
    const missing = into([], compose(
      map(([, i]) => i.photos),
      cat,
      filter(id => !photos[id])
    ), items)

    if (missing.length > 0) {
      yield all([
        put(act.photo.load(missing)),
        put(act.metadata.load(missing))
      ])
    }

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
    const { payload } = this.action

    if (!isArray(payload)) {
      const { id: ids, property, value } = this.action.payload

      assert.equal(property, 'template')

      const state = yield select(({ items, ontology, metadata }) => ({
        items, templates: ontology.template, metadata
      }))

      const props = { [property]: value }
      const template = state.templates[value]

      assert(template != null, 'unknown template')

      const data = getTemplateValues(template)
      const datakeys = data != null ? keys(data) : []
      const hasData = datakeys.length > 0

      const original = ids.map(id => [
        id,
        get(state.items, [id, property]),
        hasData ? pick(state.metadata[id], datakeys, {}, true) : null
      ])

      yield call(db.transaction, async tx => {
        await mod.item.update(tx, ids, props)

        if (hasData) {
          await mod.metadata.update(tx, { ids, data })
        }
      })

      yield put(act.item.bulk.update([ids, props]))

      if (hasData) {
        yield put(act.metadata.update({ ids, data }))
      }

      this.undo = { ...this.action, payload: original }

    } else {

      let hasData = false
      let changed = { props: {}, data: {} }

      yield call(db.transaction, async tx => {
        for (let [id, template, data] of payload) {
          changed.props[id] = { template }
          await mod.item.update(tx, [id], changed.props[id])

          if (data) {
            hasData = true
            changed.data[id] = data
            await mod.metadata.update(tx, { ids: [id], data })
          }
        }
      })

      yield put(act.item.bulk.update(changed.props))

      if (hasData) {
        yield put(act.metadata.merge(changed.data))
      }
    }
  }
}

class Merge extends Command {
  static get action() { return ITEM.MERGE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    let [[item, ...items], metadata] = yield select(state => [
      pluck(state.items, payload), state.metadata
    ])

    let { id, ...data } = metadata[item.id]

    let m = yield call(db.transaction, tx =>
      mod.item.merge(tx, item, items, metadata))

    yield all([
      put(act.photo.bulk.update([m.photos, { item: id }])),
      put(act.metadata.insert({ id, ...m.data })),
      put(act.item.select({ items: [id] }, { mod: 'replace' }))
    ])


    this.undo = act.item.split({ ...m, item, items, data })

    return {
      ...item,
      photos: [...item.photos, ...m.photos],
      tags: [...item.tags, ...m.tags],
    }
  }
}

class Split extends Command {
  static get action() { return ITEM.SPLIT }

  *exec() {
    const { db } = this.options
    const { item, items, data, lists, tags } = this.action.payload

    yield call(db.transaction, tx =>
      mod.item.split(tx, item.id, items, data, lists, tags))

    yield put(act.metadata.insert({ id: item.id, ...data }))

    this.undo = act.item.merge([item.id, ...items.map(i => i.id)])

    return item
  }
}

class Explode extends Command {
  static get action() { return ITEM.EXPLODE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    let item = yield select(state => ({
      ...state.items[payload.id]
    }))

    let photos = payload.photos || item.photos.slice(1)
    let items = {}
    let moves = {}

    if (payload.items == null) {
      yield call(db.transaction, async tx => {
        for (let photo of photos) {
          let dup = await mod.item.dup(tx, item.id)

          await mod.photo.move(tx, { ids: [photo], item: dup.id })
          moves[photo] = { item: dup.id }
          dup.photos.push(photo)

          items[dup.id] = dup
        }
      })

    } else {
      items = payload.items
      let ids = keys(items)

      assert(ids.length === photos.length)

      yield call(db.transaction, async tx => {
        await mod.item.restore(tx, ids)

        for (let i = 0, ii = photos.length; i < ii; ++i) {
          let pid = photos[i]
          let iid = ids[i]

          await mod.photo.move(tx, { ids: [pid], item: iid })
          moves[pid] = { item: iid }
        }
      })
    }

    yield put(act.photo.bulk.update(moves))

    this.undo = act.item.implode({
      item, items: keys(items)
    })

    this.redo = act.item.explode({
      id: item.id, photos, items
    })

    return {
      ...items,
      [item.id]: {
        ...item, photos: remove(item.photos, ...photos)
      }
    }
  }
}

class Implode extends Command {
  static get action() { return ITEM.IMPLODE }

  *exec() {
    const { db } = this.options
    const { item, items } = this.action.payload
    const { id, photos } = item

    yield call(db.transaction, async tx =>
      mod.item.implode(tx, { id, photos, items }))

    yield put(act.photo.bulk.update([photos, { item: id }]))
    yield put(act.item.remove(items))
    yield put(act.item.select({ items: [id] }, { mod: 'replace' }))

    return item
  }
}


class ToggleTags extends Command {
  static get action() { return ITEM.TAG.TOGGLE }

  *exec() {
    const { db } = this.options
    const { id, tags } = this.action.payload

    const current = yield select(({ items }) => items[id].tags)

    const added = []
    const removed = []

    for (let tag of tags) {
      (current.includes(tag) ? removed : added).push(tag)
    }

    if (added.length) {
      yield call(mod.item.tags.add, db, added.map(tag => ({ id, tag })))
      yield put(act.item.tags.insert({ id, tags: added }))
    }

    if (removed.length) {
      yield call(mod.item.tags.remove, db, { id, tags: removed })
      yield put(act.item.tags.remove({ id, tags: removed }))
    }

    this.undo = this.action
  }
}

class AddTag extends Command {
  static get action() { return ITEM.TAG.CREATE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const [tag] = payload.tags
    const values = payload.id.map(id => ({ id, tag }))

    yield call(mod.item.tags.add, db, values)

    this.undo = act.item.tags.delete(payload)

    return payload
  }
}

class RemoveTag extends Command {
  static get action() { return ITEM.TAG.DELETE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    yield call(mod.item.tags.remove, db, payload)

    this.undo = act.item.tags.create(payload)

    return payload
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
  Explode,
  Import,
  Implode,
  Load,
  Merge,
  Split,
  Restore,
  Save,
  AddTag,
  RemoveTag,
  ToggleTags,
  ClearTags
}
