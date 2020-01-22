'use strict'

const { call, put } = require('redux-saga/effects')
const { prompt } = require('../../dialog')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const act = require('../../actions')
const mod = require('../../models')


class Delete extends Command {
  *exec() {
    let { db } = this.options
    let items = this.action.payload

    yield call(mod.item.delete, db, items)

    yield put(act.item.bulk.update([items, { deleted: true }], {
      search: true
    }))

    this.undo = act.item.restore(items)

    return items
  }
}

Delete.register(ITEM.DELETE)


class Destroy extends Command {
  *exec() {
    let { db } = this.options
    let items = this.action.payload

    this.suspend()
    let response = yield call(prompt, 'item.destroy')
    this.resume()

    if (response.cancel) return

    try {
      if (items.length) {
        yield call(mod.item.destroy, db, items)
        yield put(act.item.remove(items))

      } else {
        yield call(mod.item.prune, db, false)

        // TODO remove deleted items from state!
      }

    } finally {
      yield put(act.history.drop(null, { search: true }))
    }
  }
}

Destroy.register(ITEM.DESTROY)


module.exports = {
  Delete,
  Destroy
}
