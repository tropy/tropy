'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const act = require('../actions')
const mod = require('../models/item')

const { ITEM } = require('../constants')

class Create extends Command {
  static get action() { return ITEM.CREATE }

  *exec() {
    const { db } = this.options

    const item = yield call([db, db.transaction], tx => mod.create(tx))
    yield put(act.item.insert(item))

    this.undo = act.item.delete(item.id)
    this.redo = act.item.restore(item.id)

    return item
  }
}

class Delete extends Command {
  static get action() { return ITEM.DELETE }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    yield call(mod.delete, db, id)
    yield put(act.item.update({ id, deleted: true }, { search: true }))

    this.undo = act.item.restore(id)
  }
}

class Destroy extends Command {
  static get action() { return ITEM.DESTROY }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    // prompt

    if (id) {
      yield call(mod.destroy, db, id)
      yield put(act.item.remove([id]))

    } else {
      yield call(mod.prune, db)
      // Remove deleted items
    }

    yield put(act.history.drop(null, { search: true }))
  }
}

class Load extends Command {
  static get action() { return ITEM.LOAD }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    const items = yield call(mod.load, db, ids)

    return items
  }
}


class Restore extends Command {
  static get action() { return ITEM.RESTORE }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    yield call([db, db.transaction], tx => mod.restore(tx, id))
    yield put(act.item.update({ id, deleted: false }, { search: true }))

    this.undo = act.item.delete(id)
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
    yield call(mod.update, db, { id, property, value })

    this.undo = act.item.save(this.original)
    this.redo = this.action
  }
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
      yield call(mod.tags.add, db, add.map(tag => ({ id, tag })))
      yield put(act.item.tags.add({ id, tags: add }))
    }

    if (remove.length) {
      yield call(mod.tags.remove, db, { id, tags: remove })
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

    yield call(mod.tags.clear, db, id)
    yield put(act.item.tags.remove({ id, tags }))

    this.undo = act.item.tags.toggle({ id, tags })
  }
}

module.exports = {
  Create,
  Delete,
  Destroy,
  Load,
  Restore,
  Save,
  ToggleTags,
  ClearTags
}
