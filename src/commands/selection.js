'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const mod = require('../models')
const act = require('../actions')
const { SELECTION } = require('../constants')
const { pick, splice } = require('../common/util')
const { keys } = Object


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
      await mod.selection.delete(tx, ...selections)
      await mod.selection.order(tx, photo, ord)
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

    const selections = yield call(mod.selection.load, db, ...payload)

    const { notes } = yield select()
    const missing = []

    // TODO DRY -- generalize fetching missing dependents.
    for (let id in selections) {
      for (let nId of selections[id].notes) {
        if (notes[nId] == null || notes[nId].pending) {
          missing.push(nId)
        }
      }
    }

    if (missing.length > 0) {
      yield put(act.note.load(missing))
    }

    return selections
  }
}

class Order extends Command {
  static get action() { return SELECTION.ORDER }

  *exec() {
    const { db } = this.options
    const { payload } = this.action
    const { photo, selections } = payload

    const cur = yield select(({ photos }) => photos[photo].selections)

    yield call(mod.selection.order, db, photo, selections)
    yield put(act.photo.update({ id: photo, selections }))

    this.undo = act.selection.order({ photo, selections: cur })
  }
}

class Restore extends Command {
  static get action() { return SELECTION.RESTORE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action
    const { photo, selections } = payload

    // Restore all selections in a batch at the former index
    // of the first selection to be restored. Need to differentiate
    // if we support selecting multiple selections!
    let [idx] = meta.idx

    let ord = yield select(({ photos }) => photos[photo].selections)
    ord = splice(ord, idx, 0, ...selections)

    yield call(db.transaction, async tx => {
      await mod.selection.restore(tx, ...selections)
      await mod.selection.order(tx, photo, ord)
    })

    yield put(act.photo.selections.add({ id: photo, selections }, { idx }))

    this.undo = act.photo.delete(payload)
  }
}

class Save extends Command {
  static get action() { return SELECTION.SAVE }

  *exec() {
    const { db } = this.options
    const { payload, meta } = this.action
    const { id, data } = payload

    const original = yield select(state =>
      pick(state.selections[id], keys(data)))

    yield call(db.transaction, tx =>
      mod.image.save(tx, { id, timestamp: meta.now, ...data }))

    this.undo = act.selection.save({ id, data: original })

    return { id, ...data }
  }
}


module.exports = {
  Create,
  Delete,
  Load,
  Order,
  Restore,
  Save
}
