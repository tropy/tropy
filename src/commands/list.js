'use strict'

const { call, put } = require('redux-saga/effects')
const { CREATE } = require('../constants/list')
const actions = require('../actions/list')
const { Command } = require('./command')

class Create extends Command {
  *exec() {
    const { action: { payload }, options: { db } } = this
    const [tmp, data] = payload

    // TODO put this in a transaction
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

module.exports = {
  Create
}
