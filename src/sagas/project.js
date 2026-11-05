import { basename, extname } from 'node:path'
import { PROJECT, IDLE } from '../constants/index.js'
import { Cache } from '../common/cache.js'
import { Store } from '../asset/index.js'
import { warn, debug } from '../common/log.js'
import { ipc } from './ipc.js'
import { consolidator } from './consolidator.js'
import { history } from './history.js'
import { matches, order, search, sync } from './search.js'
import { ontology } from './ontology.js'
import { exec } from './cmd.js'
import { commands } from '../slices/cmd.js'
import { fail } from '../dialog.js'
import * as mod from '../models/index.js'
import * as act from '../actions/index.js'
import { autosave } from './note.js'
import { persist, restore, storage } from './storage.js'
import { watch } from './watch.js'
import { handleDatabaseErrors } from './db.js'
import { transcribe } from './transcriptions.js'
import ARGS, { update } from '../args.js'
import { create, open as openProject } from '../common/project.js'
import { Migrations, Resource, Schema } from '../res.js'
import { Storage } from '../storage.js'

import '../commands/index.js'

import {
  actionChannel,
  all,
  fork,
  cancel,
  call,
  delay,
  put,
  take,
  race
} from 'redux-saga/effects'

const has = (condition) => ({ error, meta }) =>
  (!error && meta && (!meta.cmd || meta.done) && meta[condition])

const dbErrorActions = {
  SQLITE_READONLY: () => (
    act.project.update({ isReadOnly: true }, { ipc: true })
  ),
  default: act.project.close
}

const FORCE_SHUTDOWN_DELAY = 120000

// Opens and loads existing projects.
//
// If the action carries `meta.create`, the project will be created first.
// Existing files will be replaced if `overwrite` is set!
//
// Prefs windows use `opts.skipFullSetup`.
export function *open (opts, action) {
  try {
    var { payload: path, meta } = action

    if (meta?.create) {
      let { name, overwrite = false } = meta.create

      yield call(create, path, Schema.expand('project'), Resource.base, {
        name: name || basename(path, extname(path)),
        overwrite
      })
    }

    var [db, project] = yield call(openProject, path, {
      user: ARGS.uuid,
      ...opts
    })

    yield fork(handleDatabaseErrors, db, dbErrorActions)

    project.watch = Storage.load('project.watch', project.id) || {}
    project.optimize = Storage.load('project.optimize', project.id) ?? {}

    let cache = new Cache(ARGS.cache, project.id)
    let store = new Store(project.store)

    yield call(cache.init)
    yield call(store.init)

    yield put(act.project.opened(project))

    // Update window's global ARGS to allow reloading the project!
    if (project.path !== ARGS.file) {
      update({ file: project.path })
    }

    try {
      if (!opts.skipFullSetup)
        var sorted = yield call(hydrate, { db, project })

      var cchan = yield actionChannel(commands('project'))

      if (!opts.skipFullSetup) {
        yield fork(start, { db, sorted })
        yield put(act.project.ready(project))
      }

      while (true) {
        let cmd = yield take(cchan)
        yield fork(exec, { db, id: project.id, cache, store }, cmd)
      }

    } finally {
      cchan?.close()

      if (!opts.skipFullSetup)
        yield call(stop, { db, project, cache, store })
    }
  } catch (err) {
    warn({ err }, 'unexpected error in *project.open')

    if (!meta?.silent)
      yield call(fail, err,
        err.code === 'ENEWER' ? 'project.newer' : action.type)

    var error = err

    // Mark the task as cancelled.
    // Otherwise the task.isRunning() will return true even after completion!
    yield cancel()

  } finally {
    if (db)
      yield call(db.close)

    yield put(act.project.closed(error, {
      project: {
        id: project?.id,
        path: project?.path ?? action.payload
      }
    }))

    debug('*project.open terminated')
  }
}

function *hydrate ({ db, project }) {
  yield all([
    call(restore, 'nav', project.id),
    call(restore, 'notepad', project.id),
    call(restore, 'esper', project.id),
    call(restore, 'imports', project.id),
    call(restore, 'sidebar', project.id),
    call(restore, 'panel', project.id)
  ])

  yield put(act.history.drop())

  let data = yield all({
    items: call(mod.item.load, db),
    metadata: call(mod.metadata.load, db),
    photos: call(mod.photo.load, db, undefined, project),
    lists: call(mod.list.all, db),
    tags: call(mod.tag.load, db),
    selections: call(mod.selection.load, db),
    notes: call(mod.note.load, db),
    transcriptions: call(mod.transcription.load, db)
  })

  yield put(act.project.hydrate(data))

  let sorted = yield call(sync, db)
  yield call(search, db)

  return sorted
}

function *start ({ db, sorted }) {
  yield fork(matches, has('search'))
  yield fork(order, db, sorted)
  yield fork(autosave, db)
  yield fork(transcribe)
  yield fork(maintenance)
}

function *maintenance () {
  try {
    let silent = true

    yield take(IDLE.IDLE)
    debug('project maintenance: cache, check')
    yield put(act.cache.prune(null, { silent }))
    yield put(act.cache.purge(null, { silent }))

    yield put(act.project.check(null, { quick: true, silent }))

    yield take(IDLE.IDLE)
    debug('project maintenance: optimize')
    yield put(act.project.optimize(null, { silent }))

  } catch (err) {
    warn({ err }, 'unexpected error in *project.maintenance')
  }
}

function *stop ({ db, project, store }) {
  yield all([
    call(persist, 'nav', project.id),
    call(persist, 'notepad', project.id),
    call(persist, 'esper', project.id),
    call(persist, 'imports', project.id),
    call(persist, 'sidebar', project.id),
    call(persist, 'panel', project.id)
  ])

  if (db.hasBeenModified) {
    debug('pruning db...')
    yield call(mod.item.prune, db)
    yield call(mod.list.prune, db)
    yield call(mod.value.prune, db)
    yield call(mod.photo.prune, db)
    yield call(mod.selection.prune, db)
    yield call(mod.note.prune, db)
    yield call(mod.transcription.prune, db)
    yield call(mod.subject.prune, db)
    yield call(store.prune, db, project)
  }

  debug('*project.stop terminated')
}


export function *main () {
  let task
  let aux
  let crash

  try {
    aux = yield all([
      fork(ontology, { max: 1 }),
      fork(ipc),
      fork(history),
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
        if (action.payload === 'user') {
          update({ file: null })
        }

        // Break main loop if project was closed without reason.
        // This typically means that the window is being closed.
        if (!(action.error || action.payload === 'user'))
          break
      }

      if (action.type === PROJECT.OPEN) {
        task = yield fork(open, {
          max: 3,
          migrate: Migrations.project
        }, action)
      }
    }

  } catch (err) {
    crash = err
    warn({ err }, 'unexpected error in *main')

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
