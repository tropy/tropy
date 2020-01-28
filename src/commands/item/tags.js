'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const { remove } = require('../../common/util')
const act = require('../../actions')
const mod = require('../../models')
const { findTagIds } = require('../../selectors')


class AddTags extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { tags } = payload

    if (meta.resolve) {
      tags = yield select(state => findTagIds(state, tags))
    }

    let work = yield select(state =>
      payload.id.map(id => [
        id,
        remove(tags, ...state.items[id].tags)
      ]))

    yield call(
      mod.item.tags.set,
      db,
      work.flatMap(([id, tx]) =>
        tx.map(tag => ({ id, tag }))))

    for (let [id, tx] of work) {
      if (tx.length)
        yield put(act.item.tags.insert({ id, tags: tx }))
    }

    // TODO: Use work. This currently removes all tags!
    this.undo = act.item.tags.delete({ id: payload.id, tags })

    return work
  }
}

AddTags.register(ITEM.TAG.CREATE)


class RemoveTags extends Command {
  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { tags } = payload

    if (meta.resolve) {
      tags = yield select(state => findTagIds(state, tags))
    }

    let work = yield select(state =>
      payload.id.map(id => [
        id,
        tags.filter(tag => state.items[id].tags.includes(tag))
      ]))

    yield call(mod.item.tags.remove, db, { id: payload.id, tags })

    for (let [id, tx] of work) {
      if (tx.length)
        yield put(act.item.tags.remove({ id, tags: tx }))
    }

    // TODO: Use work. This currently adds all tags!
    this.undo = act.item.tags.create({ id: payload.id, tags })

    return work
  }
}

RemoveTags.register(ITEM.TAG.DELETE)


class ClearTags extends Command {
  *exec() {
    let { db } = this.options
    let id = this.action.payload

    let tags = yield select(({ items }) => items[id].tags)

    yield call(mod.item.tags.clear, db, id)
    yield put(act.item.tags.remove({ id, tags }))

    this.undo = act.item.tags.toggle({ id, tags })
  }
}

ClearTags.register(ITEM.TAG.CLEAR)


class ToggleTags extends Command {
  *exec() {
    let { db } = this.options
    let { id, tags } = this.action.payload

    let current = yield select(({ items }) => items[id].tags)

    let added = []
    let removed = []

    for (let tag of tags) {
      (current.includes(tag) ? removed : added).push(tag)
    }

    if (added.length) {
      yield call(mod.item.tags.set, db, added.map(tag => ({ id, tag })))
      yield put(act.item.tags.insert({ id, tags: added }))
    }

    if (removed.length) {
      yield call(mod.item.tags.remove, db, { id, tags: removed })
      yield put(act.item.tags.remove({ id, tags: removed }))
    }

    this.undo = this.action
  }
}

ToggleTags.register(ITEM.TAG.TOGGLE)


module.exports = {
  AddTags,
  RemoveTags,
  ToggleTags,
  ClearTags
}
