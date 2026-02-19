import { call, put, select, all } from 'redux-saga/effects'
import { Command } from '../command.js'
import * as mod from '../../models/index.js'
import act from '../../actions/list.js'
import { LIST } from '../../constants/index.js'
import { getListByName } from '../../selectors/index.js'


export class Import extends Command {
  *exec() {
    let { paths } = this.action.payload
    let { db } = this.options
    let lists = { ...(yield select(state => state.lists)) }
    let created = []

    yield call(db.transaction, tx =>
      importPaths(tx, paths, lists, created))

    yield all(created.map(({ list, idx }) =>
      put(act.insert(list, { idx }))))

    return created
  }
}

Import.register(LIST.IMPORT)

export async function importPaths(tx, paths, lists, created = []) {
  let leafIds = new Set()

  for (let path of paths) {
    path = Array.isArray(path) ? path : [path]
    let parent = LIST.ROOT

    for (let name of path) {
      let existing = getListByName({ lists }, { name, parent })

      if (!existing) {
        let idx = lists[parent]?.children?.length || 0
        existing = await mod.list.create(tx, {
          name, parent, position: 1
        })
        lists[existing.id] = existing
        if (lists[parent])
          lists[parent] = {
            ...lists[parent],
            children: [...lists[parent].children, existing.id]
          }
        created.push({ list: existing, idx })
      }

      parent = existing.id
    }

    if (parent > 0)
      leafIds.add(parent)
  }

  return leafIds
}
