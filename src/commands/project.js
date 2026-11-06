import { rm, stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { call, put, select } from 'redux-saga/effects'
import { Command } from './command.js'
import { PROJECT } from '../constants/index.js'
import { prompt } from '../dialog.js'
import { ls } from '../common/fs.js'
import { debug, info, warn } from '../common/log.js'
import { IntegrityError } from '../common/error.js'
import { pick, pMap } from '../common/util.js'
import * as act from '../actions/index.js'
import { Storage } from '../storage.js'
import photo from '../models/photo.js'
import { list, load, optimize, reindex, resolveBasePath, save } from '../common/project.js'


const isCorrupted = (state) =>
  !!state.project.warnings?.includes('corrupted')

function *check (db, { quick = false, force = false } = {}) {
  if (!force && (yield select(isCorrupted))) {
    info('skip project check: corrupted')
    return false
  }

  let START = Date.now()

  try {
    yield call(db.check, null, { quick })
    info({ quick, ms: Date.now() - START }, 'project check passed')

    if (yield select(isCorrupted)) {
      let { warnings } = yield select(state => state.project)
      yield put(act.project.update({
        warnings: warnings.filter(w => w !== 'corrupted')
      }))
    }

    return true

  } catch (err) {
    warn({ err, quick, ms: Date.now() - START }, 'project check failed')

    if (err instanceof IntegrityError) {
      let { warnings = [] } = yield select(state => state.project)

      if (!warnings.includes('corrupted'))
        yield put(act.project.update({ warnings: [...warnings, 'corrupted'] }))
    }

    return false
  }
}

export class Check extends Command {
  *exec () {
    return yield* check(this.options.db, this.action.meta)
  }
}

Check.register(PROJECT.CHECK)


export class Optimize extends Command {
  *exec () {
    let { db } = this.options
    let { force } = this.action.meta

    if (db.isReadOnly) {
      info('skip project optimize: read-only')
      return
    }

    if (yield select(isCorrupted)) {
      info('skip project optimize: corrupted')
      return
    }

    let free = Math.round(100 * (yield call(db.free)))

    if (!force && free < 20) {
      info({ free }, 'skip project optimize: too few free pages')
      return
    }

    if (!(yield* check(db, { quick: true }))) {
      info('skip project optimize: check failed')
      return
    }

    let START = Date.now()
    info({ free, force }, 'project optimize')

    yield call(db.seq, conn => optimize(conn))

    info({
      ms: Date.now() - START,
      free: Math.round(100 * (yield call(db.free)))
    }, 'project optimized')
  }
}

Optimize.register(PROJECT.OPTIMIZE)


export class Prune extends Command {
  *exec () {
    let { db, store } = this.options
    let { meta } = this.action
    let START = Date.now()

    let { project } = yield select()

    if (!project.isManaged)
      return 0

    if (project.isReadOnly) {
      info('skip project prune: read-only')
      return 0
    }

    if (dirname(store.root) !== project.path) {
      warn({
        store: store.root,
        path: project.path
      }, 'skip project prune: store not in project folder')
      return 0
    }

    let managed = yield call(list, db, project)

    let candidates = yield call(ls, store.root, {
      filter: (entry) => {
        let path = join(store.root, entry.name)
        return store.owns(path) && !managed.has(path)
      },
      recursive: false
    })

    let orphans = []

    for (let path of candidates) {
      let { mtimeMs } = yield call(stat, path)
      if (mtimeMs < START) orphans.push(path)
    }

    info({
      store: store.root,
      managed: managed.size,
      orphans: orphans.length,
      sample: orphans.slice(0, 10).map(file => basename(file))
    }, 'project prune')

    if (orphans.length === 0)
      return 0

    if (meta.prompt) {
      let count = orphans.length
      let files = orphans.map(file => basename(file))

      let { cancel } = yield this.dialog(prompt, PROJECT.PRUNE, {
        detail: files.join('\n'),
        values: { count }
      })

      if (cancel) {
        return 0
      }
    }

    let removed = (yield call(pMap, orphans, this.remove, { concurrency: 5 }))
      .filter(Boolean).length

    info({
      removed,
      failed: orphans.length - removed,
      ms: Date.now() - START
    }, 'project pruned')

    return removed
  }

  remove = async (path) => {
    try {
      debug({ path }, 'removing orphaned file from store')
      await rm(path, { force: true, maxRetries: 3 })
      return true
    } catch (err) {
      warn({ err, path }, 'failed removing orphaned file from store')
      return false
    }
  }
}

Prune.register(PROJECT.PRUNE)

export class Reindex extends Command {
  *exec () {
    let { db } = this.options

    if (db.isReadOnly) {
      info('skip project reindex: read-only')
      return false
    }

    let START = Date.now()
    info('project reindex')

    yield call(db.seq, conn => reindex(conn))
    info({ ms: Date.now() - START }, 'project reindexed')

    // Checks after the reindex, which may have repaired the project.
    return yield* check(db, { force: true })
  }
}

Reindex.register(PROJECT.REINDEX)


export class Reload extends Command {
  *exec () {
    let { db, store } = this.options

    let project = yield call(load, db)
    project.watch = Storage.load('project.watch', project.id) || {}
    project.optimize = Storage.load('project.optimize', project.id) ?? {}

    if (project.store !== store.root)
      yield call(store.init, project.store)

    return project
  }
}

Reload.register(PROJECT.RELOAD)


export class Save extends Command {
  *exec () {
    let { watch, optimize, ...payload } = this.action.payload
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

    if (optimize) {
      optimize = { ...project.optimize, ...optimize }
      Storage.save('project.optimize', optimize, id)
      changes.optimize = optimize
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

  *abort () {
    if (this.original) {
      yield put(act.project.update(this.original))
    }
  }
}

Save.register(PROJECT.SAVE)
