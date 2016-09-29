'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { SAVE } = require('../constants/project')
const actions = require('../actions/project')

class Save extends Command {
  static get action() { return SAVE }

  *exec() {
    const { payload } = this.action
    const { db, id } = this.options

    this.original = (yield select()).project

    yield put(actions.update(payload))
    yield call([db, db.run],
      'UPDATE project SET name = ? WHERE project_id = ?', payload.name, id
    )

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

