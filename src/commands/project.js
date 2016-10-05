'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const actions = require('../actions/project')
const { SAVE } = require('../constants/project')
const { save } = require('../models/project')


class Save extends Command {
  static get action() { return SAVE }

  *exec() {
    const { payload } = this.action
    const { db, id } = this.options

    this.original = (yield select()).project

    yield put(actions.update(payload))
    yield call(save, db, { id, ...payload })

    this.undo = actions.save({ name: this.original.name })
  }

  *abort() {
    if (this.original) {
      yield put(actions.update({ name: this.original.name }))
    }
  }
}

module.exports = {
  Save
}
