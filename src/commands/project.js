'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { SAVE } = require('../constants/project')
const { pick } = require('../common/util')
const act = require('../actions')
const mod = require('../models')


class Save extends Command {
  static get ACTION() { return SAVE }

  *exec() {
    let { payload } = this.action
    let { db, id } = this.options

    this.original = yield select(state =>
      pick(state.project, Object.keys(payload)))

    let doRebase = ('base' in payload && payload.base !== this.original.base)

    yield put(act.project.update(payload))

    yield call(db.transaction, async tx => {
      await mod.project.save(tx, { id, ...payload })

      if (doRebase) {
        await mod.photo.rebase(tx, payload.base, this.original.base)
      }
    })

    this.undo = act.project.save({ name: this.original.name })
  }

  *abort() {
    if (this.original) {
      yield put(act.project.update(this.original))
    }
  }
}

module.exports = {
  Save
}
