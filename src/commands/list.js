'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { CREATE, DELETE, LOAD, PRUNE, RESTORE } = require('../constants/list')
const actions = require('../actions/list')


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
        lists.push({ ...list, children: this.sort(list.children) })
      })

    return lists
  }

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


class Create extends Command {
  static get action() { return CREATE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options
    const { name, parent } = payload

    // TODO put this in a transaction and remove abort
    this.result = yield call([db, db.run],
      'INSERT INTO lists (name, parent_list_id) VALUES (?, ?)', name, parent)

    let [list, children] = yield [
      call([db, db.get],
        'SELECT list_id AS id, name, parent_list_id AS parent FROM lists WHERE id = ?',
        this.result.id),
      call([db, db.all],
        'SELECT list_id AS id FROM lists WHERE parent_list_id = ? ORDER BY position ASC',
        parent)
    ]

    children = children.map(({ id }) => id)

    yield [
      put(actions.insert([list])),
      put(actions.update({ id: parent, children }))
    ]

    this.undo = actions.delete(list.id)
    this.redo = actions.restore(list)

    return list
  }

  *abort() {
    if (this.result) {
      const { db } = this.options

      yield call([db, db.run],
        'DELETE FROM lists WHERE list_id = ?', this.result.id)
    }
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
