'use strict'

const { Command } = require('./command')
const { call, put, select } = require('redux-saga/effects')
const { pick } = require('../common/util')
const { keys } = Object

const mod = require('../models/metadata')
const act = require('../actions/metadata')


const {
  LOAD, SAVE
} = require('../constants/metadata')

class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    const data = yield call(mod.load, db, payload)

    return data
  }
}

class Save extends Command {
  static get action() { return SAVE }

  *exec() {
    const { db } = this.options
    const { id, data } = this.action.payload

    this.original = pick(
      yield select(({ metadata }) => metadata[id]),
      keys(data)
    )

    yield put(act.update([id, data]))
    yield call(mod.update, db, { id, data })

    this.undo = act.save({ id, data: this.original })
  }

  *abort() {
    yield put(act.update([this.action.payload.id, this.original]))
  }
}

module.exports = {
  Load,
  Save
}
