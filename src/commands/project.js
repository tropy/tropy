import { call, put, select } from 'redux-saga/effects'
import { Command } from './command'
import { PROJECT } from '../constants'
import { pick } from '../common/util'
import * as act from '../actions'
import * as mod from '../models'


export class Optimize extends Command {
  *exec() {
    let { db } = this.options

    yield call(db.clear)
    yield call(db.seq, conn =>
      mod.project.optimize(conn))
  }
}

Optimize.register(PROJECT.OPTIMIZE)


export class Reindex extends Command {
  *exec() {
    let { meta } = this.action
    let { db } = this.options

    yield call(db.clear)

    yield call(db.seq, conn =>
      mod.project.reindex(conn, meta))
  }
}

Reindex.register(PROJECT.REINDEX)


export class Save extends Command {
  *exec() {
    let { payload } = this.action
    let { db, id } = this.options

    let { project } = yield select()
    let original = pick(project, Object.keys(payload))

    let isRebaseRequired =
      ('base' in payload) && payload.base !== original.base

    let basePath = isRebaseRequired ?
      mod.project.getBasePath(db, payload.base) :
      project.basePath

    yield call(db.transaction, async tx => {
      await mod.project.save(tx, { id, ...payload }, basePath)

      if (isRebaseRequired) {
        await mod.photo.rebase(tx, basePath, project.basePath)
      }
    })

    yield put(act.project.update({ ...payload, basePath }, {
      ipc: payload.name != null || payload.isReadOnly != null
    }))

    this.undo = act.project.save(original)
  }
}

Save.register(PROJECT.SAVE)
