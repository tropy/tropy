'use strict'

const { warn } = require('../common/log')
const { clipboard, ipcRenderer: ipc } = require('electron')
const { Command } = require('./command')
const { SaveCommand } = require('./subject')
const { groupedByTemplate } = require('../export')
const { fail, save } = require('../dialog')
const act = require('../actions')
const mod = require('../models')
const { darwin } = require('../common/os')
const { ITEM } = require('../constants')
const { writeFile: write } = require('fs')
const { win } = require('../window')
const { get, pluck, remove } = require('../common/util')

const {
  all,
  call,
  put,
  select,
  cps
} = require('redux-saga/effects')

const {
  findTagIds,
  getGroupedItems,
  getPrintableItems
} = require('../selectors')


class Load extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let items = yield call(db.seq, conn =>
      mod.item.load(conn, payload))

    return items
  }
}

Load.register(ITEM.LOAD)


class Restore extends Command {
  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    yield call(mod.item.restore, db, ids)
    yield put(act.item.bulk.update([ids, { deleted: false }], { search: true }))

    this.undo = act.item.delete(ids)

    return ids
  }
}

Restore.register(ITEM.RESTORE)

class TemplateChange extends SaveCommand {
  type = 'item'
}
TemplateChange.register(ITEM.TEMPLATE.CHANGE)


class Merge extends Command {
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
      tags: [...item.tags, ...m.tags]
    }
  }
}

Merge.register(ITEM.MERGE)


class Split extends Command {
  *exec() {
    let { db } = this.options
    let { item, items, data, lists, tags } = this.action.payload
    let photos = this.getPhotoData(items)

    yield call(db.transaction, tx =>
      mod.item.split(tx, item.id, items, data, lists, tags))

    yield all([
      put(act.photo.update(photos)),
      put(act.metadata.insert({ id: item.id, ...data }))
    ])

    this.undo = act.item.merge([item.id, ...items.map(i => i.id)])
    this.meta = { inc: items.length }

    return item
  }

  getPhotoData(items) {
    let photos = []
    for (let item of items) {
      for (let photo of item.photos) {
        photos.push({
          id: photo,
          item: item.id
        })
      }
    }
    return photos
  }
}

Split.register(ITEM.SPLIT)


class Export extends Command {
  *exec() {
    let { target, plugin } = this.action.meta
    let ids = this.action.payload

    if (plugin) target = ':plugin:'

    try {
      if (!target) {
        this.suspend()
        target = yield call(save.items, {})
        this.resume()
      }

      if (!target) return

      let [opts, [items, ...resources]] = yield select(state => ([
        state.settings.export,
        getGroupedItems(ids)(state)
      ]))

      let results = yield call(groupedByTemplate, items, resources, opts)
      let asString = JSON.stringify(results, null, 2)

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
    } catch (e) {
      warn({ stack: e.stack }, `failed to export items to ${target}`)
      fail(e, this.action.type)
    }
  }
}

Export.register(ITEM.EXPORT)


class ToggleTags extends Command {
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

ToggleTags.register(ITEM.TAG.TOGGLE)


class Preview extends Command {
  *exec() {
    if (!darwin) return

    let { photos } = this.action.payload
    let paths = yield select(state =>
      photos.map(id => get(state.photos, [id, 'path'])))

    if (paths.length > 0) {
      win.preview(paths[0])
    }
  }
}

Preview.register(ITEM.PREVIEW)


class Print extends Command {
  *exec() {
    let [prefs, project, items] = yield select(state => ([
      state.settings.print,
      state.project.id,
      getPrintableItems(state)
    ]))

    if (items.length) {
      ipc.send('print', { ...prefs, project, items })
    }
  }
}

Print.register(ITEM.PRINT)


class AddTags extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { tags } = payload

    if (meta.resolve) {
      tags = yield select(state => findTagIds(state, tags))
    }

    let work = yield select(state =>
      payload.id.map(id => [
        id,
        remove(tags, ...state.items[id].tags)
      ]))

    yield call(
      mod.item.tags.set,
      db,
      work.flatMap(([id, tx]) =>
        tx.map(tag => ({ id, tag }))))

    for (let [id, tx] of work) {
      if (tx.length)
        yield put(act.item.tags.insert({ id, tags: tx }))
    }

    // TODO: Use work. This currently removes all tags!
    this.undo = act.item.tags.delete({ id: payload.id, tags })

    return work
  }
}

AddTags.register(ITEM.TAG.CREATE)


class RemoveTags extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { tags } = payload

    if (meta.resolve) {
      tags = yield select(state => findTagIds(state, tags))
    }

    let work = yield select(state =>
      payload.id.map(id => [
        id,
        tags.filter(tag => state.items[id].tags.includes(tag))
      ]))

    yield call(mod.item.tags.remove, db, { id: payload.id, tags })

    for (let [id, tx] of work) {
      if (tx.length)
        yield put(act.item.tags.remove({ id, tags: tx }))
    }

    // TODO: Use work. This currently adds all tags!
    this.undo = act.item.tags.create({ id: payload.id, tags })

    return work
  }
}

RemoveTags.register(ITEM.TAG.DELETE)


class ClearTags extends Command {
  *exec() {
    const { db } = this.options
    const id = this.action.payload

    const tags = yield select(({ items }) => items[id].tags)

    yield call(mod.item.tags.clear, db, id)
    yield put(act.item.tags.remove({ id, tags }))

    this.undo = act.item.tags.toggle({ id, tags })
  }
}

ClearTags.register(ITEM.TAG.CLEAR)


module.exports = {
  ...require('./item/create'),
  ...require('./item/delete'),
  ...require('./item/explode'),
  ...require('./item/import'),

  Export,
  Load,
  Merge,
  Split,
  Restore,
  TemplateChange,
  Preview,
  Print,
  AddTags,
  RemoveTags,
  ToggleTags,
  ClearTags
}
