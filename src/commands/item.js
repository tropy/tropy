'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const act = require('../actions/item')
const mod = require('../models/item')

const { ITEM } = require('../constants')

class Create extends Command {
  static get action() { return ITEM.CREATE }

  *exec() {
    const { db } = this.options

    const item = yield call([db, db.transaction], tx => mod.create(tx))
    yield put(act.insert(item))

    this.undo = act.delete(item.id)
    this.redo = act.restore(item.id)

    return item
  }
}

class Delete extends Command {
  static get action() { return ITEM.DELETE }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    yield call(mod.delete, db, id)
    yield put(act.update({ id, deleted: true }, { search: true }))

    this.undo = act.restore(id)
  }
}

class Destroy extends Command {
  static get action() { return ITEM.DESTROY }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    yield call(mod.destroy, db, id)
    yield put(act.remove([id], { search: true }))
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
    yield put(act.update({ id, deleted: false }, { search: true }))

    this.undo = act.delete(id)
  }
}

class Save extends Command {
  static get action() { return ITEM.SAVE }

  *exec() {
    const { db } = this.options
    const { id, property, value } = this.action.payload

    const cur = yield select(({ items }) => items[id])
    this.original = { id, property, value: cur[property] }

    yield put(act.update(id, { property, value }))
    yield call(mod.update, db, { id, property, value })

    this.undo = act.save(this.original)
    this.redo = this.action
  }
}

class TagToggle extends Command {
  static get action() { return ITEM.TAG.TOGGLE }

  *exec() {
    const { db } = this.options
    const { id, tag } = this.action.payload

    const tags = yield select(({ items }) => items[id].tags)
    const action = tags.includes(tag) ? 'remove' : 'add'

    yield call(mod.tags[action], db, { id, tag })
    yield put(act.tags[action]({ id, tag }))

    this.undo = this.action
  }
}

module.exports = {
  Create,
  Delete,
  Destroy,
  Load,
  Restore,
  Save,
  TagToggle
}
