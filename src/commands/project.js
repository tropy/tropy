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

export class Reload extends Command {
  *exec() {
    let { db, store } = this.options

    let project = yield call(mod.project.load, db)

    if (project.store !== store.root)
      yield call(store.init, project.store)

    return {
      isReadOnly: db.isReadOnly,
      file: db.path,
      ...project
    }
  }
}

Reload.register(PROJECT.RELOAD)

export class Save extends Command {
  *exec() {
    let { watch, ...payload } = this.action.payload
    let { db, id } = this.options

    let { project } = yield select()
    let original = pick(project, Object.keys(payload))
    let { basePath, store } = project

    let isRebaseRequired =
      ('base' in payload) && payload.base !== original.base

    if (isRebaseRequired) {
      basePath = mod.project.getBasePath(db, payload.base)
      payload = { store, ...payload }
    }

    // Save and update/reset watch settings in their entirety!
    if (watch) {
      payload.watch = (watch.folder) ?
        watch :
        { ...project.watch, ...watch }
    }

    this.original = { ...original, basePath: project.basePath }
    yield put(act.project.update({ ...payload, basePath }))

    yield call(db.transaction, async tx => {
      await mod.project.save(tx, { id, ...payload }, basePath)

      if (isRebaseRequired) {
        await mod.photo.rebase(tx, basePath, project.basePath)
      }
    })

    this.undo = act.project.save(original)
  }

  *abort() {
    if (this.original) {
      yield put(act.project.update(this.original))
    }
  }
}

Save.register(PROJECT.SAVE)
