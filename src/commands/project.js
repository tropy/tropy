import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { call, put, select } from 'redux-saga/effects'
import { Command } from './command.js'
import { PROJECT } from '../constants/index.js'
import { prompt } from '../dialog.js'
import { ls } from '../common/fs.js'
import { debug, info, warn } from '../common/log.js'
import { pick, pMap } from '../common/util.js'
import * as act from '../actions/index.js'
import { Storage } from '../storage.js'
import photo from '../models/photo.js'
import { list, load, optimize, reindex, resolveBasePath, save } from '../common/project.js'


export class Optimize extends Command {
  *exec() {
    let { db } = this.options
    yield call(db.clear)
    yield call(db.seq, conn => optimize(conn))
  }
}

Optimize.register(PROJECT.OPTIMIZE)


export class Prune extends Command {
  *exec() {
    let { db } = this.options
    let { meta } = this.action

    let { project } = yield select()
    if (!project.isManaged)
      return 0

    let managed = yield call(list, db, project)
    debug(`found ${managed.size} file(s) managed by project`)

    let orphans = yield call(ls, project.store, {
      filter: (entry) => !managed.has(join(project.store, entry.name)),
      recursive: false
    })

    if (orphans.length > 0) {
      let files = orphans.map(file => basename(file))
      info({
        files,
        store: project.store
      }, `found ${files.length} orphaned file(s) in project store`)

      if (meta.prompt) {
        let { cancel } = yield call(this.confirm, files)
        if (cancel) {
          return 0
        }
      }

      yield call(pMap, orphans, this.remove, { concurrency: 5 }, project.store)
      info(`removed ${orphans.length} orphaned file(s) from project store`)
      return orphans.length
    } else {
      info('no orphaned files found in project store')
      return 0
    }
  }

  confirm = async (files) => {
    let count = files.length
    try {
      this.suspend()
      return prompt(PROJECT.PRUNE, {
        detail: files.slice(0, 100).join(count < 10 ? '\n' : ', '),
        values: { count }
      })
    } finally {
      this.resume()
    }
  }

  remove = async (path, _, store) => {
    try {
      assert(store, 'missing asset folder')
      assert.equal(dirname(path), store, 'may only remove files in asset folder')
      debug(`removing orphaned file "${basename(path)}" from store`)
      await rm(path, { force: true, maxRetries: 3 })
    } catch (e) {
      warn({
        stack: e.stack
      }, `failed removing "${path}" from store`)
    }
  }
}

Prune.register(PROJECT.PRUNE)

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
