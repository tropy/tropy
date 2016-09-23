'use strict'

const { call, put, select } = require('redux-saga/effects')
const actions = require('../actions/list')
const { Command } = require('./command')

class Create extends Command {
  *exec() {
    const { payload } = this.action
    const { db } = this.options
    const [tmp, data] = payload

    // TODO put this in a transaction
    // TODO id, position
    const { lastID: id } = yield call([db, db.run],
      'INSERT INTO lists (name) VALUES (?)', data.name)

    const list = yield call([db, db.get],
      'SELECT list_id AS id, name, parent_list_id AS parent FROM lists WHERE id = ?',
      id)

    yield put(actions.remove(tmp))
    yield put(actions.insert([list]))

    return actions.delete(id)
  }
}

class Delete extends Command {
  *exec() {
    const { payload } = this.action
    const { db } = this.options

    this.original = (yield select()).lists[payload]

    if (this.original) {
      yield put(actions.remove(this.original.id))
      yield call([db, db.run],
        'DELETE FROM lists WHERE list_id = ?', this.original.id)

      return actions.create(this.original)
    }
  }

  *abort() {
    if (this.original) {
      yield put(actions.insert([this.original]))
    }
  }
}

module.exports = {
  Create,
  Delete
}
