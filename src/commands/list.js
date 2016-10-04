'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { CREATE, DELETE, LOAD, PRUNE, RESTORE } = require('../constants/list')
const actions = require('../actions/list')
const get = require('../selectors/list')

const List = {

  async all(db) {
    const lists = []

    await db.each(`
      SELECT l1.list_id AS id, l1.name, l1.parent_list_id AS parent,
        group_concat(l2.position || ':' || l2.list_id) AS children
      FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
      GROUP BY l1.list_id;
      `,
      list => {
        lists.push({ ...list, children: List.sort(list.children) })
      })

    return lists
  },

  async create(db, { name, parent, position }) {
    const { id } = await db.run(
      'INSERT INTO lists (name, parent_list_id, position) VALUES (?, ?, ?)',
      name, parent, position)

    return { id, name, parent }
  },



  sort(children) {
    return children ?
      children
        .split(/,/)
        .reduce((res, nxt) => {
          const [pos, id] = nxt.split(/:/).map(Number)
          res[pos - 1] = id
          return res
        }, []) : []

  }
}


class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    const { db } = this.options
    return (yield call(List.all, db))
  }
}


class Create extends Command {
  static get action() { return CREATE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options
    const { name, parent } = payload

    const position =
      (yield select(get.list, { list: parent })).children.length + 1

    const list = yield call(List.create, db, { name, parent, position })

    yield put(actions.insert(list, { position }))

    this.undo = actions.delete(list.id)
    this.redo = actions.restore(list)

    return list
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
        'UPDATE lists SET parent_list_id = NULL WHERE list_id = ?',
        this.original.id)

      this.undo = actions.restore([null, this.original])
    }
  }

  *abort() {
    if (this.original) {
      yield put(actions.insert([this.original]))
    }
  }
}


class Restore extends Command {
  static get action() { return RESTORE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options

    yield put(actions.insert(payload))

    yield call([db, db.run],
      'UPDATE lists SET parent_list_id = ? WHERE list_id = ?',
      payload.parent, payload.id)

    this.undo = actions.delete(payload.id)
  }

  *abort() {
    yield put(actions.remove(this.action.payload.id))
  }
}


class Prune extends Command {
  static get action() { return PRUNE }

  *exec() {
    const { db } = this.options

    yield call([db, db.run],
      'DELETE FROM lists WHERE list_id <> 0 AND parent_list_id IS NULL')
  }
}

module.exports = {
  Create,
  Delete,
  Load,
  Prune,
  Restore
}
