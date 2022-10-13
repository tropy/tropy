import { call, put, select } from 'redux-saga/effects'
import { Command } from './command.js'
import { PROJECT } from '../constants/index.js'
import { pick } from '../common/util.js'
import * as act from '../actions/index.js'
import { Storage } from '../storage.js'
import photo from '../models/photo.js'
import { load, optimize, reindex, resolveBasePath, save } from '../common/project.js'


export class Optimize extends Command {
  *exec() {
    let { db } = this.options
    yield call(db.clear)
    yield call(db.seq, conn => optimize(conn))
  }
}

Optimize.register(PROJECT.OPTIMIZE)


export class Reindex extends Command {
  *exec() {
    let { db } = this.options
    yield call(db.clear)
    yield call(db.seq, conn => reindex(conn))
  }
}

Reindex.register(PROJECT.REINDEX)


export class Reload extends Command {
  *exec() {
    let { db, store } = this.options

    let project = yield call(load, db)
    project.watch = Storage.load('project.watch', project.id) || {}

    if (project.store !== store.root)
      yield call(store.init, project.store)

    return project
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
      basePath = resolveBasePath(db, payload.base)
      payload = { store, ...payload }
    }

    this.original = { ...original, basePath: project.basePath }
    let changes = { ...payload, basePath }

    // Save and update/reset watch settings in their entirety!
    if (watch) {
      if (!watch.folder)
        watch = { ...project.watch, ...watch }

      Storage.save('project.watch', watch, id)
      changes.watch = watch
    }

    yield put(act.project.update(changes))

    yield call(db.transaction, async tx => {
      await save(tx, { id, ...payload }, basePath)

      if (isRebaseRequired) {
        await photo.rebase(tx, basePath, project.basePath)
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
