'use strict'

const { Command } = require('./command')
const { call, put, select } = require('redux-saga/effects')
const { map } = require('../common/util')
const mod = require('../models/metadata')
const act = require('../actions/metadata')
const { LOAD, SAVE } = require('../constants/metadata')


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

    const current = (yield select(({ metadata }) => metadata[id])) || {}
    this.original = map(data, key => current[key])

    yield put(act.update([id, data]))
    yield call([db, db.transaction], tx => mod.update(tx, { ids: [id], data }))

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
