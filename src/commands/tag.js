'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { TAG, SASS } = require('../constants')
const { pick, sample } = require('../common/util')
const { keys } = Object
const mod = require('../models')
const act = require('../actions')


class Load extends Command {
  static get ACTION() { return TAG.LOAD }

  *exec() {
    return (yield call(mod.tag.load, this.options.db, this.action.payload))
  }
}


class Create extends Command {
  static get ACTION() { return TAG.CREATE }

  *exec() {
    let { db } = this.options
    let { items, ...data } = this.action.payload

    let hasItems = (items && items.length > 0)
    let color = yield select(state => state.settings.tagColor)

    if (data.color == null)
      data.color = color
    if (data.color === 'random')
      data.color = sample(SASS.TAG.COLORS)

    let tag = yield call(db.transaction, async tx => {
      let tg = await mod.tag.create(tx, data)
      if (hasItems) await mod.item.tags.add(tx, { id: items, tag: tg.id })
      return tg
    })

    if (hasItems) {
      yield put(act.item.tags.insert({ id: items, tags: [tag.id] }))
    }

    this.undo = act.tag.delete(tag.id)

    return tag
  }
}

class Save extends Command {
  static get ACTION() { return TAG.SAVE }

  *exec() {
    let { db } = this.options
    let { payload } = this.action

    this.original = yield select(state =>
      pick(state.tags[payload.id], keys(payload)))

    yield put(act.tag.update(payload))
    yield call(mod.tag.save, db, payload)

    this.undo = act.tag.save(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(act.tag.update(this.original))
    }
  }
}


class Delete extends Command {
  static get ACTION() { return TAG.DELETE }

  *exec() {
    let { db } = this.options
    let id = this.action.payload

    let items = yield call(mod.tag.items, db, id)
    let tag = yield select(state => state.tags[id])

    yield call(mod.tag.delete, db, [id])

    if (items.length > 0) {
      yield put(act.item.tags.remove({ id: items, tags: [id] }))
    }

    this.undo = act.tag.create({ ...tag, items })

    return id
  }
}


module.exports = {
  Create,
  Delete,
  Load,
  Save
}
