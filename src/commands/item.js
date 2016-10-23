'use strict'

const { call, put } = require('redux-saga/effects')
const { Command } = require('./command')

const {
  CREATE
} = require('../constants/item')

const act = require('../actions/item')

const {
  create
} = require('../models/item')


class Create extends Command {
  static get action() { return CREATE }

  *exec() {
    const { db } = this.options

    const item = yield call(create, db)
    yield put(act.insert(item))

    this.undo = act.remove(item.id)
    this.redo = act.restore(item.id)

    return item
  }
}

module.exports = {
  Create
}
