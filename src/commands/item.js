'use strict'

const { clipboard } = require('electron')
const assert = require('assert')
const { warn, verbose } = require('../common/log')
const { DuplicateError } = require('../common/error')
const { all, call, put, select, cps } = require('redux-saga/effects')
const { Command } = require('./command')
const { ImportCommand } = require('./import')
const { prompt, open, fail, save } = require('../dialog')
const { Image } = require('../image')
const { text } = require('../value')
const act = require('../actions')
const mod = require('../models')
const { get, pluck, pick, remove } = require('../common/util')
const { darwin } = require('../common/os')
const { ITEM, DC } = require('../constants')
const { MODE } = require('../constants/project')
const { keys } = Object
const { isArray } = Array
const { writeFile: write } = require('fs')
const { win } = require('../window')
const { groupedByTemplate } = require('../export')

const {
  getGroupedItems,
  getItemTemplate,
  getPhotoTemplate,
  getTemplateValues,
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
    yield put(act.item.select({ items: [item.id] }, { mod: 'replace' }))

    this.undo = act.item.delete([item.id])
    this.redo = act.item.restore([item.id])

    return item
  }
}

class Import extends ImportCommand {
  static get action() { return ITEM.IMPORT }

  *exec() {
    const { db } = this.options
    let { files, list } = this.action.payload

    const items = []

    if (!files) {
      this.isInteractive = true
      files = yield call(open.images)
    }

    if (!files) return []

    yield put(act.nav.update({ mode: MODE.PROJECT, query: '' }))

    const [itemp, ptemp] = yield all([
      select(getItemTemplate),
      select(getPhotoTemplate)
    ])

    const defaultItemData = getTemplateValues(itemp)
    const defaultPhotoData = getTemplateValues(ptemp)

    for (let i = 0, total = files.length; i < total; ++i) {
      let file, image, item, photo

      try {
        file = files[i]
        image = yield call(Image.read, file)

        yield* this.handleDuplicate(image)

        yield call(db.transaction, async tx => {
          item = await mod.item.create(tx, itemp.id, {
            [DC.title]: text(image.title), ...defaultItemData
          })

          photo = await mod.photo.create(tx, ptemp.id, {
            item: item.id, image, data: defaultPhotoData
          })

          if (list) {
            await mod.list.items.add(tx, list, [item.id])
            // item.lists.push(list)
          }

          item.photos.push(photo.id)
        })

        yield* this.createThumbnails(photo.id, image)

        yield put(act.metadata.load([item.id, photo.id]))

        yield all([
          put(act.item.insert(item)),
          put(act.photo.insert(photo)),
          put(act.activity.update(this.action, { total, progress: i + 1 }))
        ])

        items.push(item.id)

      } catch (error) {
        if (error instanceof DuplicateError) continue

        warn(`Failed to import "${file}": ${error.message}`)
        verbose(error.stack)

        fail(error, this.action.type)
      }
    }

    if (items.length) {
      this.undo = act.item.delete(items)
      this.redo = act.item.restore(items)
    }

    return items
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

    const { cancel } = yield call(prompt, 'message', {
      prefix: 'dialog.prompt.item.destroy.'
    })

    this.init = performance.now()
    if (cancel) return

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
    const { payload } = this.action

    const items = yield call(db.seq, conn =>
      mod.item.load(conn, payload))

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

    return ids
  }
}

class Save extends Command {
  static get action() { return ITEM.SAVE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action

    if (!isArray(payload)) {
      const { id: ids, property, value } = this.action.payload

      assert.equal(property, 'template')

      const state = yield select(({ items, ontology, metadata }) => ({
        items, templates: ontology.template, metadata
      }))

      const props = { [property]: value, modified: new Date(meta.now) }
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
        await mod.item.update(tx, ids, props, meta.now)

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
          changed.props[id] = { template, modified: new Date(meta.now) }
          await mod.item.update(tx, [id], changed.props[id], meta.now)

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
    this.meta = { dec: items.length }

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
    this.meta = { inc: items.length }

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

      yield put(act.metadata.load(keys(items)))

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

    this.meta = { inc: photos.length }

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

    this.meta = { dec: items.length }

    return item
  }
}

class Export extends Command {
  static get action() { return ITEM.EXPORT }

  *exec() {
    let { target, plugin } = this.action.meta
    const ids = this.action.payload
    if (plugin) target = ':plugin:'

    try {
      if (!target) {
        this.isInteractive = true
        target = yield call(save.items, {})
      }

      if (!target) return

      const [templateItems, ...resources] = yield select(getGroupedItems(ids))

      const results = yield call(groupedByTemplate, templateItems, resources)
      const asString = JSON.stringify(results, null, 2)

      switch (target) {
        case ':clipboard:':
          yield call(clipboard.writeText, asString)
          break
        case ':plugin:':
          yield win.plugins.export(plugin, results)
          break
        default:
          yield cps(write, target, asString)
      }
    } catch (error) {
      warn(`Failed to export items to ${target}: ${error.message}`)
      verbose(error.stack)

      fail(error, this.action.type)
    }
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
      yield call(mod.item.tags.set, db, added.map(tag => ({ id, tag })))
      yield put(act.item.tags.insert({ id, tags: added }))
    }

    if (removed.length) {
      yield call(mod.item.tags.remove, db, { id, tags: removed })
      yield put(act.item.tags.remove({ id, tags: removed }))
    }

    this.undo = this.action
  }
}

class Preview extends Command {
  static get action() { return ITEM.PREVIEW }

  *exec() {
    if (!darwin) return

    const { photos } = this.action.payload
    const paths = yield select(state =>
      photos.map(id => get(state.photos, [id, 'path'])))

    if (paths.length > 0) {
      win.current.previewFile(paths[0])
    }
  }
}

class AddTag extends Command {
  static get action() { return ITEM.TAG.CREATE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const [tag] = payload.tags
    const id = payload.id

    const res = yield call(db.transaction, tx =>
      mod.item.tags.add(tx, { id, tag }))

    this.undo = act.item.tags.delete({ id: res.id, tags: [tag] })

    return { id: res.id, tags: [tag] }
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
  Export,
  Import,
  Implode,
  Load,
  Merge,
  Split,
  Restore,
  Save,
  Preview,
  AddTag,
  RemoveTag,
  ToggleTags,
  ClearTags
}
