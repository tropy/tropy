'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const act = require('../actions/item')
const mod = require('../models/item')

const {
  CREATE, LOAD, SAVE
} = require('../constants/item')



class Create extends Command {
  static get action() { return CREATE }

  *exec() {
    const { db } = this.options

    const item = yield call([db, db.transaction], tx => mod.create(tx))
    yield put(act.insert(item))

    this.undo = act.remove(item.id)
    this.redo = act.insert(item)

    return item
  }
}

class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const items = yield call(mod.load, db, payload)

    return items
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
  Load,
  Save
}
