'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('./command')
const { pluck, splice, warp } = require('../common/util')
const { LIST } = require('../constants')

const actions = require('../actions/list')
const mod = require('../models/list')


class Load extends Command {
  static get ACTION() { return LIST.LOAD }

  *exec() {
    const { db } = this.options
    return (yield call(mod.all, db))
  }
}


class Create extends Command {
  static get ACTION() { return LIST.CREATE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options
    const { name, parent } = payload

    const { children } = yield select(state => state.lists[parent])
    const idx = children.length

    const list = yield call(mod.create, db, { name, parent, position: idx + 1 })

    yield put(actions.insert(list, { idx }))

    this.undo = actions.delete(list.id)
    this.redo = actions.restore(list, { idx })

    return list
  }
}

class Save extends Command {
  static get ACTION() { return LIST.SAVE }

  *exec() {
    const { payload } = this.action
    const { db } = this.options

    this.original = yield select(state => state.lists[payload.id])

    yield put(actions.update(payload))
    yield call(mod.save, db, payload)

    this.undo = actions.save(this.original)
  }

  *abort() {
    if (this.original) {
      yield put(actions.update(this.original))
    }
  }
}


class Delete extends Command {
  static get ACTION() { return LIST.DELETE }

  *exec() {
    const { payload: id } = this.action
    const { db } = this.options
    const { lists } = yield select()

    const original = lists[id]
    const parent = lists[original.parent]

    const idx = parent.children.indexOf(id)
    const cid = splice(parent.children, idx, 1)

    yield call(db.transaction, async tx => {
      await mod.remove(tx, id)
      await mod.order(tx, parent.id, cid)
    })

    yield put(actions.remove(id))

    this.undo = actions.restore(original, { idx })

    return [original, idx]
  }
}


class Restore extends Command {
  static get ACTION() { return LIST.RESTORE }

  *exec() {
    const { db } = this.options
    const { idx } = this.action.meta
    const list = this.action.payload

    const { children } = yield select(state => state.lists[list.parent])
    const cid = splice(children, idx, 0, list.id)

    yield call(db.transaction, async tx => {
      await mod.restore(tx, list.id, list.parent)
      await mod.order(tx, list.parent, cid)
    })

    yield put(actions.insert(list, { idx }))

    this.undo = actions.delete(list.id)
  }
}

class Move extends Command {
  static get ACTION() { return LIST.MOVE }

  *exec() {
    let { db } = this.options
    let list = this.action.payload
    let to = this.action.meta.idx
    let idx

    let [original, parent] = yield select(state =>
      pluck(state.lists, [list.id, list.parent]))

    if (parent.id === original.parent) {
      idx = parent.children.indexOf(list.id)
      let children = warp(parent.children, idx, to)

      yield call(mod.order, db, parent.id, children)
      yield put(actions.update({ id: parent.id, children }))

    } else {
      let oldParent = yield select(state => state.lists[original.parent])
      idx = oldParent.children.indexOf(list.id)

      let oldChildren = splice(oldParent.children, idx, 1)
      let children = splice(parent.children, to, 0, list.id)

      yield call(db.transaction, async tx => {
        await mod.save(tx, { id: list.id, parent_list_id: parent.id })
        await mod.order(tx, parent.id, children)
        await mod.order(tx, oldParent.id, oldChildren)
      })

      yield put(actions.update([
        { id: oldParent.id, children: oldChildren },
        { id: list.id, parent: parent.id },
        { id: parent.id, children }
      ]))
    }

    this.undo = actions.move({ id: list.id, parent: original.parent }, { idx })
    return list
  }
}

class AddItems extends Command {
  static get ACTION() { return LIST.ITEM.ADD }

  *exec() {
    const { db } = this.options
    const { id, items } = this.action.payload

    const res = yield call(db.transaction, tx =>
      mod.items.add(tx, id, items))

    this.undo = actions.items.remove({ id, items: res.items })
    this.redo = actions.items.restore({ id, items: res.items })

    return { id, items: res.items }
  }
}

class RemoveItems extends Command {
  static get ACTION() { return LIST.ITEM.REMOVE }

  *exec() {
    const { db } = this.options
    const { id, items } = this.action.payload

    yield call(mod.items.remove, db, id, items)

    this.undo = actions.items.restore({ id, items })

    return { id, items }
  }
}

class RestoreItems extends Command {
  static get ACTION() { return LIST.ITEM.RESTORE }

  *exec() {
    const { db } = this.options
    const { id, items } = this.action.payload

    yield call(mod.items.restore, db, id, items)

    this.undo = actions.items.remove({ id, items })

    return { id, items }
  }
}


module.exports = {
  Create,
  Delete,
  Load,
  Restore,
  Save,
  Move,
  AddItems,
  RemoveItems,
  RestoreItems
}
