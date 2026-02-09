import { resolve } from 'node:path'
import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { ITEM } from '../../constants/index.js'
import { prompt } from '../../dialog.js'
import * as act from '../../actions/index.js'
import * as mod from '../../models/index.js'
import { normalize } from '../../common/os.js'

import {
  getItemTemplate,
  getTemplateValues
} from '../../selectors/index.js'


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
    let { db, store } = this.options
    let items = this.action.payload

    // Get photo paths before deleting (for managed projects)
    let project = yield select(state => state.project)
    let photoPaths = []

    if (project.isManaged) {
      let photos = yield call([db, db.all], `
        SELECT path, checksum, protocol
        FROM photos
        JOIN images USING (id)
        WHERE item_id IN (${items.join(',')}) AND protocol = 'file'
      `)
      photoPaths = photos
    }

    yield call(mod.item.delete, db, items)

    yield put(act.item.bulk.update([items, { deleted: true }], {
      search: true
    }))

    // Remove files from store for managed projects
    if (project.isManaged && photoPaths.length > 0) {
      for (let photo of photoPaths) {
        // Resolve the relative path to absolute path using basePath
        let absolutePath = resolve(project.basePath, normalize(photo.path))
        yield call([store, store.remove], {
          ...photo,
          path: absolutePath
        })
      }
    }

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
