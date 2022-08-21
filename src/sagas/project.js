import assert from 'node:assert'
import { join } from 'node:path'
import { PROJECT, IDLE } from '../constants/index.js'
import { Cache } from '../common/cache.js'
import { Store } from '../asset/index.js'
import { warn, debug } from '../common/log.js'
import { ipc } from './ipc.js'
import { consolidator } from './consolidator.js'
import { history } from './history.js'
import { search } from './search.js'
import { ontology } from './ontology.js'
import { exec, commands } from './cmd.js'
import { shell } from './shell.js'
import { fail } from '../dialog.js'
import * as mod from '../models/index.js'
import * as act from '../actions/index.js'
import { persist, restore, storage } from './storage.js'
import { watch } from './watch.js'
import { handleDatabaseErrors } from './db.js'
import ARGS, { update } from '../args.js'

import {
  all,
  fork,
  cancel,
  call,
  delay,
  put,
  take,
  takeEvery as every,
  race
} from 'redux-saga/effects'

const has = (condition) => (({ error, meta }) =>
  (!error && meta && (!meta.cmd || meta.done) && meta[condition]))

const dbErrorActions = {
  SQLITE_READONLY: () => (
    act.project.update({ isReadOnly: true }, { ipc: true })
  ),
  default: act.project.close
}

const FORCE_SHUTDOWN_DELAY = 60000

export function *open(opts = {}, { payload, meta }) {
  try {
    let { Database } = yield import('../common/db')
    var db = yield call(Database.open, payload, meta, { max: opts.max || 3 })

    yield fork(handleDatabaseErrors, db, dbErrorActions)

    let project = yield call(load, db, opts)

    let cache = new Cache(ARGS.cache, project.id)
    let store = new Store(project.store)

    yield call(cache.init)
    yield call(store.init)

    // Update window's global ARGS to allow reloading the project!
    if (db.path !== ARGS.file) {
      update({ file: db.path })
    }

    yield put(act.project.opened({
      isReadOnly: db.isReadOnly,
      file: db.path,
      ...project
    }))

    try {
      if (!opts.noSetup)
        yield fork(setup, db, project)

      while (true) {
        let action = yield take(commands('project'))
        yield fork(exec, { db, id: project.id, cache, store }, action)
      }

    } finally {
      if (!opts.noSetup)
        yield call(teardown, { db, project, cache, store })

      yield call(mod.project.close, db, project)
    }
  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *project.open')
    yield call(fail, e, db.path)

    // Mark the task as cancelled. Otherwise the task will appear to be
    // running even after the finally block completes.
    yield cancel()

  } finally {
    yield call(db.close)
    yield put(act.project.closed())

    debug('*project.open terminated')
  }
}

export function *load(db, opts) {
  if (!(db.isReadOnly || opts.skipMigration))
    var migrations = yield call(
      db.migrate,
      join(ARGS.app, 'db', 'migrate', 'project'))

  let project = yield call(mod.project.load, db)
  assert(project != null && project.id != null, 'invalid project')

  if (migrations?.length > 0) {
    project.accessId = yield call(mod.access.open, db)

  } else {
    try {
      if (!(db.isReadOnly || opts.skipIntegrityCheck))
        yield call(db.check)

      db.once('update', async () => {
        project.accessId = await mod.access.open(db)
      })

    } catch (_) {
      warn('project file may be corrupted!')
      project.isCorrupted = true
    }
  }

  return project
}


function *setup(db, project) {
  try {
    yield every(has('search'), search, db)

    yield all([
      call(restore, 'nav', project.id),
      call(restore, 'notepad', project.id),
      call(restore, 'esper', project.id),
      call(restore, 'imports', project.id),
      call(restore, 'sidebar', project.id),
      call(restore, 'panel', project.id)
    ])

    yield all([
      put(act.history.drop()),
      put(act.list.load()),
      put(act.tag.load()),
      put(act.item.load()),
      put(act.photo.load()),
      put(act.metadata.load()),
      put(act.selection.load()),
      put(act.note.load())
    ])

    yield call(search, db)

    yield take(IDLE.IDLE)
    yield put(act.cache.prune())
    yield put(act.cache.purge())

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *setup')
    yield call(fail, e, db.path)

  } finally {
    debug('*setup terminated')
  }
}

function *teardown({ db, project, store }) {
  yield all([
    call(persist, 'nav', project.id),
    call(persist, 'notepad', project.id),
    call(persist, 'esper', project.id),
    call(persist, 'imports', project.id),
    call(persist, 'sidebar', project.id),
    call(persist, 'panel', project.id)
  ])

  if (project.accessId != null) {
    yield call(mod.access.close, db, project.accessId)

    debug('pruning db...')
    yield call(mod.item.prune, db)
    yield call(mod.list.prune, db)
    yield call(mod.value.prune, db)
    yield call(mod.photo.prune, db)
    yield call(mod.selection.prune, db)
    yield call(mod.note.prune, db)
    yield call(mod.subject.prune, db)
    yield call(store.prune, db)
    yield call(mod.access.prune, db)
  }

  debug('*teardown terminated')
}


export function *main() {
  // Delayed import with command registation side-effect!
  yield import('../commands')

  let task
  let aux
  let crash

  try {
    aux = yield all([
      fork(ontology, { max: 1 }),
      fork(ipc),
      fork(history),
      fork(shell),
      fork(storage),
      fork(consolidator),
      fork(watch)
    ])

    aux.START = Date.now()

    yield all([
      call(restore, 'projectFiles'),
      call(restore, 'recent'),
      call(restore, 'settings'),
      call(restore, 'ui')
    ])

    while (true) {
      let action = yield take([PROJECT.OPEN, PROJECT.CLOSE])

      debug(`*main "${action.type}" received`)

      if (task != null && task.isRunning()) {
        yield cancel(task)
        yield race({
          closed: take(PROJECT.CLOSED),
          timeout: delay(FORCE_SHUTDOWN_DELAY)
        })

        task = null
      }

      if (action.type === PROJECT.CLOSE) {
        // Clear project file if project was closed by user.
        if (action.payload === 'user')
          update({ file: null })

        // Break main loop if project was closed without reason.
        // This typically means that the window is being closed.
        if (!(action.error || action.payload === 'user'))
          break
      }

      if (action.type === PROJECT.OPEN) {
        task = yield fork(open, {}, action)
      }
    }

  } catch (e) {
    crash = e
    warn({ stack: e.stack }, 'unexpected error in *main')

  } finally {
    yield all([
      call(persist, 'projectFiles'),
      call(persist, 'recent'),
      call(persist, 'settings'),
      call(persist, 'ui')
    ])

    // HACK: Ensure we don't cancel aux tasks too early!
    if (Date.now() - aux.START < 1000) {
      yield delay(1000)
    }

    yield cancel(aux)

    // HACK: We cannot wait for cancelled tasks to complete.
    // See redux-saga#1242
    yield delay(200)

    if (crash != null)
      process.crash()

    debug('*main terminated')
  }
}
