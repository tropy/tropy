'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { TAG } = require('../constants')
const mod = require('../models')
const act = require('../actions')


class Load extends Command {
  static get action() { return TAG.LOAD }

  *exec() {
    return (yield call(mod.tag.load, this.options.db))
  }
}


class Create extends Command {
  static get action() { return TAG.CREATE }

  *exec() {
    const { db } = this.options
    const { name, items } = this.action.payload

    const tag = yield call(mod.tag.create, db, { name })
    yield put(act.tag.insert(tag))

    if (items) {
      const values = { id: items, tags: [tag.id] }
      yield call(mod.item.tags.add, db, values)
      yield call(act.item.tags.add, db, values)
    }

    this.undo = act.tag.hide(tag.id)
    this.redo = act.tag.show(tag.id)

    return tag
  }
}

class Save extends Command {
  static get action() { return TAG.SAVE }

  *exec() {
    const { db } = this.options
    const { id, name } = this.action.payload

    this.original = yield select(({ tags }) => tags[id])

    yield put(act.tag.update({ id, name }))
    yield call(mod.tag.save, db, { id, name })

    this.undo = act.tag.save(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(act.tag.update(this.original))
    }
  }
}


class Hide extends Command {
  static get action() { return TAG.HIDE }

  *exec() {
    const { payload: id } = this.action
    const { db } = this.options

    yield call(mod.tag.hide, db, id)
    yield put(act.tag.update({ id, visible: false }))

    this.undo = act.tag.show(id)
  }
}


class Show extends Command {
  static get action() { return TAG.SHOW }

  *exec() {
    const { payload: id } = this.action
    const { db } = this.options

    yield call(mod.tag.show, db, id)
    yield put(act.tag.update({ id, visible: true }))

    this.undo = act.tag.hide(id)
  }
}


module.exports = {
  Create,
  Hide,
  Load,
  Save,
  Show
}
