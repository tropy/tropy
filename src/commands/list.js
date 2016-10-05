'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')

const {
  CREATE, DELETE, LOAD, PRUNE, RESTORE, SAVE
} = require('../constants/list')

const actions = require('../actions/list')
const get = require('../selectors/list')

const {
  all, create, remove, restore, save, prune
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

    const position =
      (yield select(get.list, { list: parent })).children.length + 1

    const list = yield call(create, db, { name, parent, position })

    yield put(actions.insert(list, { position }))

    this.undo = actions.delete(list.id)
    this.redo = actions.restore(list)

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
    const position = lists[original.parent].children.indexOf(id) + 1

    yield call(remove, db, id)
    yield put(actions.remove(id))

    this.undo = actions.restore(original, { position })

    return [original, position]
  }
}


class Restore extends Command {
  static get action() { return RESTORE }

  *exec() {
    const { payload: list, meta: { position } } = this.action
    const { db } = this.options

    yield call(restore, db, list.id, list.parent)
    yield put(actions.insert(list, { position }))

    this.undo = actions.delete(list.id)
  }
}


class Prune extends Command {
  static get action() { return PRUNE }

  *exec() {
    const { db } = this.options
    yield call(prune, db)
  }
}

module.exports = {
  Create,
  Delete,
  Load,
  Prune,
  Restore,
  Save
}
