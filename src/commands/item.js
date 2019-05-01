'use strict'

const { debug, warn } = require('../common/log')
debug('ITEM 1')
const { clipboard } = require('electron')
debug('ITEM 2')
const assert = require('assert')
debug('ITEM 3')
const { DuplicateError } = require('../common/error')
debug('ITEM 4')
const { all, call, put, select, cps } = require('redux-saga/effects')
debug('ITEM 5')
const { Command } = require('./command')
debug('ITEM 6')
const { ImportCommand } = require('./import')
debug('ITEM 7')
const { SaveCommand } = require('./subject')
debug('ITEM 8')
const { prompt, open, fail, save } = require('../dialog')
debug('ITEM 9')
const act = require('../actions')
debug('ITEM 10')
const mod = require('../models')
debug('ITEM 11')
const { get, pluck, remove } = require('../common/util')
debug('ITEM 12')
const { darwin } = require('../common/os')
debug('ITEM 13')
const { ITEM } = require('../constants')
debug('ITEM 14')
const { MODE } = require('../constants/project')
debug('ITEM 15')
const { keys } = Object
debug('ITEM 16')
const { writeFile: write } = require('fs')
debug('ITEM 17')
const { win } = require('../window')
debug('ITEM 18')
const { groupedByTemplate } = require('../export')
debug('ITEM 19')

const {
  getGroupedItems,
  getItemTemplate,
  getPhotoTemplate,
  getTemplateValues
} = require('../selectors')
debug('ITEM 20')


class Create extends Command {
  static get ACTION() { return ITEM.CREATE }

  *exec() {
    let { db } = this.options

    let template = yield select(getItemTemplate)
    let data = getTemplateValues(template)

    let item = yield call(db.transaction, tx =>
      mod.item.create(tx, template.id, data))

    yield put(act.item.insert(item))
    yield put(act.item.select({ items: [item.id] }, { mod: 'replace' }))

    this.undo = act.item.delete([item.id])
    this.redo = act.item.restore([item.id])

    return item
  }
}

class Import extends ImportCommand {
  static get ACTION() { return ITEM.IMPORT }

  *exec() {
    let { db } = this.options
    let { files, list } = this.action.payload

    let items = []

    if (!files) {
      this.isInteractive = true
      files = yield call(open.items)
    }

    if (!files) return []

    yield put(act.nav.update({ mode: MODE.PROJECT, query: '' }))

    let [base, ttp] = yield select(state => [
      state.project.base,
      {
        item: getItemTemplate(state),
        photo: getPhotoTemplate(state)
      }
    ])

    for (let i = 0, total = files.length; i < total; ++i) {
      let file, image, item, data
      let photos = []

      try {
        yield put(act.activity.update(this.action, { total, progress: i + 1 }))

        file = files[i]

        image = yield* this.openImage(file)
        yield* this.handleDuplicate(image)
        data = yield* this.getMetadata(image, ttp)

        yield call(db.transaction, async tx => {
          item = await mod.item.create(tx, ttp.item.id, data.item)

          while (!image.done) {
            let photo = await mod.photo.create(tx,
              { base, template: ttp.photo.id },
              { item: item.id, image, data: data.photo })

            if (list) {
              await mod.list.items.add(tx, list, [item.id])
              // item.lists.push(list)
            }

            item.photos.push(photo.id)
            photos.push(photo)
            image.next()
          }
        })

        image.rewind()

        while (!image.done) {
          let photo = photos[image.page]

          yield* this.createThumbnails(photo.id, image)
          yield put(act.metadata.load([item.id, photo.id]))
          yield put(act.photo.insert(photo))

          image.next()
        }

        yield put(act.item.insert(item))
        items.push(item.id)

      } catch (error) {
        if (error instanceof DuplicateError) {
          debug(`Skipping duplicate "${file}"...`)
          continue
        }

        warn(`Failed to import "${file}": ${error.message}`, {
          stack: error.stack
        })
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
  static get ACTION() { return ITEM.DELETE }

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
  static get ACTION() { return ITEM.DESTROY }

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
  static get ACTION() { return ITEM.LOAD }

  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let items = yield call(db.seq, conn =>
      mod.item.load(conn, payload))

    return items
  }
}


class Restore extends Command {
  static get ACTION() { return ITEM.RESTORE }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    yield call(mod.item.restore, db, ids)
    yield put(act.item.bulk.update([ids, { deleted: false }], { search: true }))

    this.undo = act.item.delete(ids)

    return ids
  }
}

class TemplateChange extends SaveCommand {
  static get ACTION() { return ITEM.TEMPLATE.CHANGE }
  get type() { return 'item' }
}

class Merge extends Command {
  static get ACTION() { return ITEM.MERGE }

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
  static get ACTION() { return ITEM.SPLIT }

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

class Explode extends Command {
  static get ACTION() { return ITEM.EXPLODE }

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
  static get ACTION() { return ITEM.IMPLODE }

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
  static get ACTION() { return ITEM.EXPORT }

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
      warn(`Failed to export items to ${target}: ${error.message}`, {
        stack: error.stack
      })
      fail(error, this.action.type)
    }
  }
}

class ToggleTags extends Command {
  static get ACTION() { return ITEM.TAG.TOGGLE }

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
  static get ACTION() { return ITEM.PREVIEW }

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
  static get ACTION() { return ITEM.TAG.CREATE }

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
  static get ACTION() { return ITEM.TAG.DELETE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    yield call(mod.item.tags.remove, db, payload)

    this.undo = act.item.tags.create(payload)

    return payload
  }
}


class ClearTags extends Command {
  static get ACTION() { return ITEM.TAG.CLEAR }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    const tags = yield select(({ items }) => items[id].tags)

    yield call(mod.item.tags.clear, db, id)
    yield put(act.item.tags.remove({ id, tags }))

    this.undo = act.item.tags.toggle({ id, tags })
  }
}

debug('ITEM 21')

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
  TemplateChange,
  Preview,
  AddTag,
  RemoveTag,
  ToggleTags,
  ClearTags
}
