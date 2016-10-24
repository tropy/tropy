'use strict'

const { call, put } = require('redux-saga/effects')
const { Command } = require('./command')
const act = require('../actions/item')

const {
  CREATE, LOAD
} = require('../constants/item')

const {
  create, load
} = require('../models/item')


class Create extends Command {
  static get action() { return CREATE }

  *exec() {
    const { db } = this.options

    const item = yield call([db, db.transaction], tx => create(tx))
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

    const items = yield call(load, db, payload)

    return items
  }
}

module.exports = {
  Create,
  Load
}
