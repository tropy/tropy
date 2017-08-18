'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const mod = require('../models')
const act = require('../actions')
const { SELECTION } = require('../constants')

class Create extends Command {
  static get action() { return SELECTION.CREATE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action

    const idx = (meta.idx != null) ? meta.idx : [
      yield select(state => state.photos[payload.photo].selections.length)
    ]

    const selection = yield call(db.transaction, tx =>
      mod.selection.create(tx, null, payload))

    const photo = selection.photo
    const selections = [selection.id]

    yield put(act.photo.selections.add({ id: photo, selections }, { idx }))

    this.undo = act.selection.delete({ photo, selections }, { idx })
    this.redo = act.selection.restore({ photo, selections }, { idx })

    return selection
  }
}

class Load extends Command {
  static get action() { return SELECTION.LOAD }

  *exec() {
    const { db } = this.options
    const { payload } = this.action

    return yield call(mod.selection.load, db, payload)
  }
}

module.exports = {
  Create,
  Load
}
