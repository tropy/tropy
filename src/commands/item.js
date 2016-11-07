'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const act = require('../actions/item')
const mod = require('../models/item')

const {
  CREATE, DELETE, LOAD, RESTORE, SAVE
} = require('../constants/item')



class Create extends Command {
  static get action() { return CREATE }

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
  static get action() { return DELETE }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    yield call(mod.delete, db, id)
    yield put(act.update({ id, deleted: true }, { search: true }))

    this.undo = act.restore(id)
  }
}

class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    const { db } = this.options
    const ids = this.action.payload

    const items = yield call(mod.load, db, ids)

    return items
  }
}


class Restore extends Command {
  static get action() { return RESTORE }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    yield call([db, db.transaction], tx => mod.restore(tx, id))
    yield put(act.update({ id, deleted: false }, { search: true }))

    this.undo = act.delete(id)
  }
}

class Save extends Command {
  static get action() { return SAVE }

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

module.exports = {
  Create,
  Delete,
  Load,
  Restore,
  Save
}
