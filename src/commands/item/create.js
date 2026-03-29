import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { ITEM } from '../../constants/index.js'
import { prompt } from '../../dialog.js'
import * as act from '../../actions/index.js'
import * as mod from '../../models/index.js'

import {
  getItemTemplate,
  getTemplateValues
} from '../../selectors/index.js'


export class Create extends Command {
  *exec () {
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


export class Delete extends Command {
  *exec () {
    let { db } = this.options
    let items = this.action.payload
    let { lists } = this.action.meta

    yield call(mod.item.delete, db, items)

    yield put(act.item.bulk.update([items, { deleted: true }], {
      search: true
    }))

    if (lists?.length) {
      for (let { list } of lists.toReversed()) {
        yield call(mod.list.remove, db, list.id)
        yield put(act.list.remove(list.id))
      }
    }

    this.undo = act.item.restore(items, { lists })

    return items
  }
}

Delete.register(ITEM.DELETE)


export class Destroy extends Command {
  async confirm () {
    try {
      this.suspend()
      return !(await prompt('item.destroy')).cancel

    } finally {
      this.resume()
    }
  }

  *exec () {
    let { db } = this.options
    let items = this.action.payload

    if (!(yield call([this, this.confirm])))
      return

    try {
      if (items.length) {
        yield call(mod.item.destroy, db, items)
      } else {
        items = yield call(mod.item.prune, db, false)
      }

      if (items.length) {
        yield put(act.item.remove(items))
      }

    } finally {
      yield put(act.history.drop(null, { search: true }))
    }
  }
}

Destroy.register(ITEM.DESTROY)


export class Restore extends Command {
  *exec () {
    let { db } = this.options
    let items = this.action.payload
    let { lists } = this.action.meta

    yield call(mod.item.restore, db, items)
    yield put(act.item.bulk.update([items, { deleted: false }], {
      search: true
    }))

    if (lists?.length) {
      for (let { list, idx } of lists) {
        yield call(mod.list.restore, db, list.id, list.parent)
        yield put(act.list.insert(list, { idx }))
      }
    }

    this.undo = act.item.delete(items, { lists })

    return items
  }
}

Restore.register(ITEM.RESTORE)
