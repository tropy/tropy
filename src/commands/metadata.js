'use strict'

const { Command } = require('./command')
const { call, put, select } = require('redux-saga/effects')
const { pick } = require('../common/util')
const mod = require('../models/metadata')
const act = require('../actions/metadata')
const { LOAD, RESTORE, SAVE } = require('../constants/metadata')
const { keys, values } = Object


class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    return (
      yield call(mod.load, this.options.db, this.action.payload)
    )
  }
}

class Restore extends Command {
  static get action() { return RESTORE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action

    this.original = yield select(({ metadata }) =>
      pick(metadata, keys(payload)))

    yield put(act.replace(payload))

    yield call(db.transaction, async tx => {
      for (let { id, ...data } of values(payload)) {
        await mod.replace(tx, {
          ids: [id],
          data,
          timestamp: meta.now
        })
      }
    })

    this.undo = act.restore(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(act.replace(this.original))
    }
  }
}

class Save extends Command {
  static get action() { return SAVE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action
    const { ids, data } = payload

    this.original = yield select(({ metadata }) =>
      pick(metadata, ids))

    yield put(act.update({
      ids,
      data,
      timestamp: meta.now
    }, { replace: meta.replace }))

    yield call(db.transaction, tx =>
      mod.update(tx, { ids, data }, meta.replace))

    this.undo = act.restore(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(act.replace(this.original))
    }
  }
}


module.exports = {
  Load,
  Restore,
  Save
}
