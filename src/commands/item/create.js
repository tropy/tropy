import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { ITEM } from '../../constants'
import { prompt } from '../../dialog'
import * as act from '../../actions'
import * as mod from '../../models'

import {
  getItemTemplate,
  getTemplateValues
} from '../../selectors'


export class Create extends Command {
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


export class Delete extends Command {
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


export class Destroy extends Command {
  async confirm() {
    try {
      this.suspend()
      return !(await prompt('item.destroy')).cancel

    } finally {
      this.resume()
    }
  }

  *exec() {
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
