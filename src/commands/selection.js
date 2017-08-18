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

class Delete extends Command {
  static get action() { return SELECTION.DELETE }

  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const { photo, selections } = payload

    let ord = yield select(({ photos }) => photos[photo].selections)
    let idx = selections.map(id => ord.indexOf(id))

    ord = ord.filter(id => !selections.includes(id))

    yield call(db.transaction, async tx => {
      await mod.selection.delete(tx, selections)
      //await mod.selection.order(tx, photo, ord)
    })

    yield put(act.photo.selections.remove({ id: photo, selections }))

    this.undo = act.selection.restore(payload, { idx })
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
  Delete,
  Load
}
