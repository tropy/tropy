'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const act = require('../actions/item')
const mod = require('../models/item')

const {
  CREATE, DELETE, RESTORE, SAVE
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
    yield put(act.remove(id))

    this.undo = act.restore(id)
  }
}

class Restore extends Command {
  static get action() { return RESTORE }

  *exec() {
    const { db } = this.options
    const id = this.action.payload

    const item = yield call([db, db.transaction], tx => mod.restore(tx, id))
    yield put(act.insert(item))

    this.undo = act.delete(item.id)
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
  Restore,
  Save
}
