import assert from 'assert'
import fs from 'fs'
import { PROJECT, IDLE } from '../constants'
import { Database } from '../common/db'
import { Cache } from '../common/cache'
import { warn, debug } from '../common/log'
import { ipc } from './ipc'
import { consolidator } from './consolidator'
import { history } from './history'
import { search } from './search'
import { ontology } from './ontology'
import { exec, commands } from './cmd'
import { shell } from './shell'
import { fail } from '../dialog'
import * as mod from '../models'
import * as act from '../actions'
import { persist, restore, storage } from './storage'
import { handleDatabaseErrors } from './db'
import ARGS, { update } from '../args'

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

import('../commands')

const has = (condition) => (({ error, meta }) =>
  (!error && meta && (!meta.cmd || meta.done) && meta[condition]))

const dbErrorActions = {
  SQLITE_READONLY: () => (
    act.project.update({ isReadOnly: true }, { ipc: true })
  ),
  default: act.project.close
}

const FORCE_SHUTDOWN_DELAY = 60000

const canWrite = (file) =>
  fs.promises.access(file, fs.constants.W_OK)
    .then(() => true, () => false)


export function *open(file, meta) {
  try {
    let ro = (meta.isReadOnly || !(yield call(canWrite, file)))
    var db = new Database(file, ro ? 'r' : 'w')

    yield fork(handleDatabaseErrors, db, dbErrorActions)

    if (!db.isReadOnly)
      var migrations = yield call(db.migrate, 'project')

    let project = yield call(mod.project.load, db)
    assert(project != null && project.id != null, 'invalid project')

    if (migrations?.length > 0) {
      project.accessId = yield call(mod.access.open, db)

    } else {
      try {
        yield call(db.check)

        db.once('update', async () => {
          project.accessId = await mod.access.open(db)
        })

      } catch (_) {
        warn('project file may be corrupted!')
        project.isCorrupted = true
      }
    }

    // Update window's global ARGS to allow reloading the project!
    if (db.path !== ARGS.file) {
      update({ file: db.path })
    }

    let cache = new Cache(ARGS.cache, project.id)
    yield call(cache.init)

    yield put(act.project.opened({
      isReadOnly: db.isReadOnly,
      file: db.path,
      ...project
    }))

    try {
      yield fork(setup, db, project)

      while (true) {
        let action = yield take(commands('project'))
        yield fork(exec, { db, id: project.id, cache }, action)
      }

    } finally {
      yield call(close, db, project, cache)
    }
  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *open')
    yield call(fail, e, db.path)

    // Mark the task as cancelled. Otherwise the task will appear to be
    // running even after the finally block completes.
    yield cancel()

  } finally {
    yield call(db.close)
    yield put(act.project.closed())

    debug('*open terminated')
  }
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

function *close(db, project) {
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
    yield call(mod.access.prune, db)
  }

  debug('*close terminated')
}


export function *main() {
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
      fork(consolidator)
    ])

    aux.START = Date.now()

    yield all([
      call(restore, 'recent'),
      call(restore, 'settings'),
      call(restore, 'ui')
    ])

    while (true) {
      let { type, payload, meta } = yield take([PROJECT.OPEN, PROJECT.CLOSE])

      debug(`*main "${type}" received`)

      if (task != null && task.isRunning()) {
        yield cancel(task)
        yield race({
          closed: take(PROJECT.CLOSED),
          timeout: delay(FORCE_SHUTDOWN_DELAY)
        })

        task = null
      }

      if (type === PROJECT.CLOSE && payload !== 'user')
        break

      if (type === PROJECT.OPEN) {
        task = yield fork(open, payload, meta)
      }
    }

  } catch (e) {
    crash = e
    warn({ stack: e.stack }, 'unexpected error in *main')

  } finally {
    yield all([
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
