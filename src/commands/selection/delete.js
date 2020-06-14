'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { SELECTION } = require('../../constants')
const { get, last, splice } = require('../../common/util')
const mod = require('../../models')
const act = require('../../actions')


class Delete extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let [nav, photo] = yield select(state => ([
      state.nav,
      state.photos[payload.photo]
    ]))

    let idx = payload.selections.map(id => photo.selections.indexOf(id))
    let order = photo.selections.filter(id => !payload.selections.includes(id))

    yield call(db.transaction, async tx => {
      await mod.selection.delete(tx, ...payload.selections)
      await mod.selection.order(tx, photo.id, order)
    })

    if (nav.selection != null) {
      let selected = payload.selections.indexOf(nav.selection)
      if (selected !== -1) {
        yield* this.select(
          photo.item,
          photo.id,
          order[idx[selected]] ?? last(order))
      }
    }

    yield put(act.photo.selections.remove({
      id: photo.id,
      selections: payload.selections
    }))

    this.undo = act.selection.restore(payload, { idx })
  }

  *select(item, photo, selection) {
    if (selection != null) {
      var note = yield select(state =>
        get(state.selections, [selection, 'notes', 0], null))
    }

    yield put(act.photo.select({
      item,
      photo,
      note,
      selection
    }))
  }
}

Delete.register(SELECTION.DELETE)


class Restore extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { photo, selections } = payload

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

Restore.register(SELECTION.RESTORE)


module.exports = {
  Delete,
  Restore
}
