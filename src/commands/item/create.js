'use strict'

const { call, put, select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')

const act = require('../../actions')
const mod = require('../../models')

const {
  getItemTemplate,
  getTemplateValues
} = require('../../selectors')


class Create extends Command {
  *exec() {
    let { db } = this.options

    let template = yield select(getItemTemplate)
    let data = getTemplateValues(template)

    let item = yield call(db.transaction, tx =>
      mod.item.create(tx, template.id, data))

    yield put(act.item.insert(item))
    yield put(act.item.select({ items: [item.id] }, { mod: 'replace' }))

    this.undo = act.item.delete([item.id])
    this.redo = act.item.restore([item.id])

    return item
  }
}

Create.register(ITEM.CREATE)


class Delete extends Command {
  *exec() {
    let { db } = this.options
    let items = this.action.payload

    yield call(mod.item.delete, db, items)

    yield put(act.item.bulk.update([items, { deleted: true }], {
      search: true
    }))

    this.undo = act.item.restore(items)

    return items
  }
}

Delete.register(ITEM.DELETE)


class Destroy extends Command {
  *exec() {
    let { db } = this.options
    let items = this.action.payload

    this.suspend()
    let response = yield call(prompt, 'item.destroy')
    this.resume()

    if (response.cancel) return

    try {
      if (items.length) {
        yield call(mod.item.destroy, db, items)
        yield put(act.item.remove(items))

      } else {
        yield call(mod.item.prune, db, false)

        // TODO remove deleted items from state!
      }

    } finally {
      yield put(act.history.drop(null, { search: true }))
    }
  }
}

Destroy.register(ITEM.DESTROY)


class Restore extends Command {
  *exec() {
    let { db } = this.options
    let items = this.action.payload

    yield call(mod.item.restore, db, items)
    yield put(act.item.bulk.update([items, { deleted: false }], {
      search: true
    }))

    this.undo = act.item.delete(items)

    return items
  }
}

Restore.register(ITEM.RESTORE)


module.exports = {
  Create,
  Delete,
  Destroy,
  Restore
}
