'use strict'

const { Command } = require('./command')
const { call, put, select } = require('redux-saga/effects')
const { pick } = require('../common/util')
const { text } = require('../value')
const mod = require('../models/metadata')
const act = require('../actions/metadata')
const { METADATA } = require('../constants')
const { keys } = Object


class Load extends Command {
  static get ACTION() { return METADATA.LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const data = yield call(mod.load, db, payload)
    return data
  }
}

class Restore extends Command {
  static get ACTION() { return METADATA.RESTORE }

  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action

    let ids = keys(payload)
    this.original = {}

    yield select(({ metadata }) => {
      for (let id of ids) {
        this.original[id] = pick(metadata[id], keys(payload[id]), {}, true)
      }
    })

    yield put(act.merge(payload))

    yield call(db.transaction, async tx => {
      for (let id of ids) {
        await mod.update(tx, {
          id,
          data: payload[id],
          timestamp: meta.now
        })
      }
    })

    this.undo = act.restore(this.original)

    return ids
  }

  *abort() {
    if (this.original) {
      yield put(act.merge(this.original))
    }
  }
}

class Save extends Command {
  static get ACTION() { return METADATA.SAVE }

  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { ids, data } = payload

    this.original = {}

    yield select(({ metadata }) => {
      let props = keys(data)

      for (let id of ids) {
        this.original[id] = pick(metadata[id], props, {}, true)
      }
    })

    yield put(act.update({ ids, data, }))

    yield call(db.transaction, tx =>
      mod.update(tx, {
        id: ids,
        data,
        timestamp: meta.now
      }))

    this.undo = act.restore(this.original)

    return ids
  }

  *abort() {
    if (this.original) {
      yield put(act.merge(this.original))
    }
  }
}

class Add extends Command {
  static get ACTION() { return METADATA.ADD }

  *exec() {
    let { payload } = this.action
    let { id, property, value } = payload

    if (value == null) value = text('')

    yield put(act.update({
      ids: id, data: { [property]: value }
    }))

    this.undo = act.delete({ id, property })
  }
}

class Delete extends Command {
  static get ACTION() { return METADATA.DELETE }

  *exec() {
    let { db } = this.options
    let { payload } = this.action
    let { id, property } = payload

    let original = {}

    yield select(({ metadata }) => {
      for (let x of id) {
        original[x] = pick(metadata[x], [property], {}, true)
      }
    })

    yield call(mod.remove, db, { id, property })
    yield put(act.remove([id, property]))

    this.undo = act.restore(original)
  }
}


module.exports = {
  Add,
  Delete,
  Load,
  Restore,
  Save
}
