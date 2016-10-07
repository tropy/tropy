'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')

const {
  CREATE, HIDE, LOAD, SAVE, SHOW
} = require('../constants/tag')

const act = require('../actions/tag')
const get = require('../selectors/tag')

const {
  all, create, hide, save, show
} = require('../models/tag')



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

    const tag = yield call(create, db, payload)
    yield put(act.insert(tag))

    this.undo = act.hide(tag.id)
    this.redo = act.show(tag.id)

    return tag
  }
}

class Save extends Command {
  static get action() { return SAVE }

  *exec() {
    const { db } = this.options
    const { id, name } = this.action.payload

    this.original = yield select(get.tag, { tag: id })

    yield put(act.update({ id, name }))
    yield call(save, db, { id, name })

    this.undo = act.save(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(act.update(this.original))
    }
  }
}


class Hide extends Command {
  static get action() { return HIDE }

  *exec() {
    const { payload: id } = this.action
    const { db } = this.options

    yield call(hide, db, id)
    yield put(act.update({ id, visible: false }))

    this.undo = act.show(id)
  }
}


class Show extends Command {
  static get action() { return SHOW }

  *exec() {
    const { payload: id } = this.action
    const { db } = this.options

    yield call(show, db, id)
    yield put(act.update({ id, visible: true }))

    this.undo = act.hide(id)
  }
}


module.exports = {
  Create,
  Hide,
  Load,
  Save,
  Show
}
