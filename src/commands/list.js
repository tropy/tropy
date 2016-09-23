'use strict'

const { call, put } = require('redux-saga/effects')
//const { CREATE, DELETE } = require('../constants/list')
const actions = require('../actions/list')
const { tick } = require('../actions/history')
const { freeze } = Object

class Create {

  constructor(db, action) {
    this.db = db
    this.action = action
  }

  *execute() {
    try {
      this.init = performance.now()

      const { db, action: { payload, meta } } = this
      const [tmp, data] = payload

      // TODO put this in a transaction
      const { lastID: id } = yield call([db, db.run],
        'INSERT INTO lists (name) VALUES (?)', data.name)

      const list = yield call([db, db.get],
        'SELECT list_id AS id, name, parent_list_id AS parent FROM lists WHERE id = ?',
        id)

      yield put(actions.remove(tmp))
      yield put(actions.insert([list]))

      this.undo = actions.delete(id)

      if (meta.history) {
        yield put(tick(this))
      }

    } catch (error) {
      this.error = error
      yield this.abort()

      throw error

    } finally {
      this.done = performance.now()
      freeze(this)
    }
  }

  *abort() {
  }

  get redo() {
    return this.action
  }
}

module.exports = {
  Create
}
