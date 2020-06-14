'use strict'

const { Command } = require('../command')
const { call, put, select } = require('redux-saga/effects')
const { PHOTO } = require('../../constants')
const { get, last, splice } = require('../../common/util')
const act = require('../../actions')
const mod = require('../../models')


class Delete extends Command {
  *exec() {
    let { db } = this.options
    let { payload } = this.action

    let [nav, item] = yield select(state => ([
      state.nav,
      state.items[payload.item]
    ]))

    let idx = payload.photos.map(id => item.photos.indexOf(id))
    let order = item.photos.filter(id => !payload.photos.includes(id))

    yield call([db, db.transaction], async tx => {
      await mod.photo.delete(tx, payload.photos)
      await mod.photo.order(tx, item.id, order)
    })

    if (nav.photo != null) {
      let selected = payload.photos.indexOf(nav.photo)
      if (selected !== -1) {
        yield* this.select(item.id, order[idx[selected]] ?? last(order))
      }
    }

    yield put(act.item.photos.remove({
      id: item.id,
      photos: payload.photos
    }))

    this.undo = act.photo.restore(payload, { idx })
  }

  *select(item, photo) {
    if (photo != null) {
      var note = yield select(state =>
        get(state.photos, [photo, 'notes', 0], null))
    }

    yield put(act.photo.select({
      item,
      photo,
      note
    }))
  }
}

Delete.register(PHOTO.DELETE)


class Restore extends Command {
  *exec() {
    let { db } = this.options
    let { item, photos } = this.action.payload

    // Restore all photos in a batch at the former index
    // of the first photo to be restored. Need to differentiate
    // if we support selecting multiple photos!
    let [idx] = this.action.meta.idx
    let order = yield select(state => state.items[item].photos)

    order = splice(order, idx, 0, ...photos)

    yield call([db, db.transaction], async tx => {
      await mod.photo.restore(tx, { item, ids: photos })
      await mod.photo.order(tx, item, order)
    })

    yield put(act.item.photos.add({ id: item, photos }, { idx }))

    this.undo = act.photo.delete({ item, photos })
  }
}

Restore.register(PHOTO.RESTORE)


module.exports = {
  Delete,
  Restore
}
