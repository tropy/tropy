'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { splice } = require('../common/util')

const {
  CREATE, DELETE, LOAD, RESTORE, SAVE, ITEM
} = require('../constants/list')

const actions = require('../actions/list')
const get = require('../selectors/list')

const {
  all, create, remove, restore, save, order
} = require('../models/list')



class Load extends Command {
  static get action() { return LOAD }

  *exec() {
    const { db } = this.options
    return (yield call(all, db))
  }
}


class Create extends Command {
  static get action() { return CREATE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options
    const { name, parent } = payload

    const idx =
      (yield select(get.list, { list: parent })).children.length

    const list = yield call(create, db, { name, parent, position: idx + 1 })

    yield put(actions.insert(list, { idx }))

    this.undo = actions.delete(list.id)
    this.redo = actions.restore(list, { idx })

    return list
  }
}

class Save extends Command {
  static get action() { return SAVE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options

    this.original = (yield select(get.list, { list: payload.id }))

    yield put(actions.update(payload))
    yield call(save, db, payload)

    this.undo = actions.save(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(actions.update(this.original))
    }
  }
}


class Delete extends Command {
  static get action() { return DELETE }

  *exec() {
    const { payload: id } = this.action
    const { db } = this.options
    const { lists } = yield select()

    const original = lists[id]
    const parent = lists[original.parent]

    const idx = parent.children.indexOf(id)
    const cid = splice(parent.children, idx, 1)

    yield call([db, db.transaction], async tx => {
      await remove(tx, id)
      await order(tx, parent.id, cid)
    })

    yield put(actions.remove(id))

    this.undo = actions.restore(original, { idx })

    return [original, idx]
  }
}


class Restore extends Command {
  static get action() { return RESTORE }

  *exec() {
    const { payload: list, meta: { idx } } = this.action
    const { db } = this.options

    const { children } = yield select(get.list, { list: list.parent })
    const cid = splice(children, idx, 0, list.id)

    yield call([db, db.transaction], async tx => {
      await restore(tx, list.id, list.parent)
      await order(tx, list.parent, cid)
    })

    yield put(actions.insert(list, { idx }))

    this.undo = actions.delete(list.id)
  }
}

class AddItems extends Command {
  static get action() { return ITEM.ADD }

  *exec() {
  }
}

class RemoveItems extends Command {
  static get action() { return ITEM.REMOVE }

  *exec() {
  }
}


module.exports = {
  Create,
  Delete,
  Load,
  Restore,
  Save,
  AddItems,
  RemoveItems
}
