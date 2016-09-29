'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { CREATE, DELETE, LOAD } = require('../constants/list')
const actions = require('../actions/list')

function sort(children) {
  return children ?
    children
      .split(/,/)
      .reduce((res, nxt) => {
        const [pos, id] = nxt.split(/:/).map(Number)
        res[pos - 1] = id
        return res
      }, []) : []

}

class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    const { db } = this.options

    const lists = []

    yield call([db, db.each],
      `SELECT l1.list_id AS id, l1.name, l1.parent_list_id AS parent,
        group_concat(l2.position || ':' || l2.list_id) AS children
        FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
        GROUP BY l1.list_id;
      `,
      list => {
        lists.push({ ...list, children: sort(list.children) })
      })

    yield put(actions.insert(lists))
  }
}

class Create extends Command {
  static get action() { return CREATE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options
    const [tmp, data] = payload

    if (tmp) {
      yield put(actions.remove(tmp))
    }

    // TODO put this in a transaction
    // TODO id, position
    const { id } = yield call([db, db.run],
      'INSERT INTO lists (name) VALUES (?)', data.name)

    const list = yield call([db, db.get],
      'SELECT list_id AS id, name, parent_list_id AS parent FROM lists WHERE id = ?',
      id)

    yield put(actions.insert([list]))

    return actions.delete(id)
  }
}

class Delete extends Command {
  static get action() { return DELETE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options

    this.original = (yield select()).lists[payload]

    if (this.original) {
      yield put(actions.remove(this.original.id))
      yield call([db, db.run],
        'DELETE FROM lists WHERE list_id = ?', this.original.id)

      return actions.create([null, this.original])
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
  Delete,
  Load
}
