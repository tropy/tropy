import { call, put, select } from 'redux-saga/effects'
import { dirname } from 'path'
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


export class Rebase extends Command {
  *exec() {
    let { db, id } = this.options
    let { project } = yield select()

    // Temporary: only toggle between absolute and project-relative!
    let base = (project.base) ? null : dirname(project.file)

    yield call(db.transaction, async tx => {
      await mod.project.save(tx, { id, base: (base) ? 'project' : null })
      await mod.photo.rebase(tx, base, project.base)
    })

    yield put(act.project.update({ base }))
    this.undo = act.project.rebase()
  }
}

Rebase.register(PROJECT.REBASE)


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

    let original = yield select(state =>
      pick(state.project, Object.keys(payload)))

    let doRebase = ('base' in payload && payload.base !== original.base)

    yield call(db.transaction, async tx => {
      await mod.project.save(tx, { id, ...payload })

      if (doRebase) {
        await mod.photo.rebase(tx, payload.base, this.original.base)
      }
    })

    yield put(act.project.update(payload, {
      ipc: payload.name != null || payload.isReadOnly != null
    }))

    this.undo = act.project.save(original)
  }
}

Save.register(PROJECT.SAVE)
