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

class Copy extends Command {
  static get ACTION() {
    return METADATA.COPY
  }

  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action

    let data = yield this.fetch()

    yield put(act.merge(data))

    yield call(db.transaction, async tx => {
      for (let id of payload.id) {
        await mod.update(tx, {
          id,
          data: data[id],
          timestamp: meta.now
        })
      }
    })

    return payload
  }

  *fetch() {
    let { payload, meta } = this.action
    let { from, to } = payload

    let copy = {}
    let data = {}

    yield select(({ metadata }) => {
      let props = meta.cut ? [from, to] : [to]

      for (let id of payload.id) {
        let md = metadata[id] || {}

        copy[id] = pick(md, props, {}, true)
        data[id] = { [to]: md[from] }

        if (meta.cut) {
          data[id][from] = null
        }
      }
    })

    this.undo = act.restore(copy)
    this.original = copy

    return data
  }

  *abort() {
    if (this.original) {
      yield put(act.merge(this.original))
    }
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
  Copy,
  Delete,
  Load,
  Restore,
  Save
}
