'use strict'

const assert = require('assert')
const { OPEN, CLOSE, CLOSED, MIGRATIONS } = require('../constants/project')
const { IDLE } = require('../constants/idle')
const { Database } = require('../common/db')
const { Cache } = require('../common/cache')
const { warn, debug } = require('../common/log')
const { ipc } = require('./ipc')
const consolidator = require('./consolidator')
const { history } = require('./history')
const { search } = require('./search')
const { ontology } = require('./ontology')
const { exec } = require('./cmd')
const { shell } = require('./shell')
const { fail } = require('../dialog')
const mod = require('../models')
const act = require('../actions')
const storage = require('./storage')
const { onErrorPut } = require('./db')
const args = require('../args')

const {
  all, fork, cancel, call, delay, put, take, takeEvery: every, race
} = require('redux-saga/effects')

const has = (condition) => (({ error, meta }) =>
  (!error && meta && (!meta.cmd || meta.done) && meta[condition]))

const command = ({ error, meta }) =>
  (!error && meta && meta.cmd === 'project')

const onErrorClose = onErrorPut(act.project.close)

const FORCE_SHUTDOWN_DELAY = 60000


function *open(file) {
  try {
    var db = new Database(file, 'w')

    yield fork(onErrorClose, db)
    yield call(db.migrate, MIGRATIONS)

    let project = yield call(mod.project.load, db)
    let access = yield call(mod.access.open, db)

    assert(project != null && project.id != null, 'invalid project')

    // Update window's global ARGS to allow reloading the project!
    if (db.path !== ARGS.file) {
      args.update({ file: db.path })
    }

    let cache = new Cache(ARGS.cache, project.id)
    yield call(cache.init)

    yield put(act.project.opened({ file: db.path, ...project }))

    try {
      yield fork(setup, db, project)

      while (true) {
        let action = yield take(command)
        yield fork(exec, { db, id: project.id, cache }, action)
      }

    } finally {
      yield call(close, db, project, access, cache)
    }
  } catch (error) {
    warn(`unexpected error in *open: ${error.message}`, {
      stack: error.stack
    })
    yield call(fail, error, db.path)

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
      call(storage.restore, 'nav', project.id),
      call(storage.restore, 'notepad', project.id),
      call(storage.restore, 'esper', project.id),
      call(storage.restore, 'imports', project.id),
      call(storage.restore, 'sidebar', project.id),
      call(storage.restore, 'panel', project.id)
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

    yield take(IDLE)
    yield put(act.cache.prune())
    yield put(act.cache.purge())

  } catch (error) {
    warn(`unexpected error in *setup: ${error.message}`, {
      stack: error.stack
    })
    yield call(fail, error, db.path)

  } finally {
    debug('*setup terminated')
  }
}

function *close(db, project, access) {
  if (access != null && access.id > 0) {
    yield call(mod.access.close, db, access.id)
  }

  yield all([
    call(storage.persist, 'nav', project.id),
    call(storage.persist, 'notepad', project.id),
    call(storage.persist, 'esper', project.id),
    call(storage.persist, 'imports', project.id),
    call(storage.persist, 'sidebar', project.id),
    call(storage.persist, 'panel', project.id)
  ])

  debug('pruning db...')
  yield call(mod.item.prune, db)
  yield call(mod.list.prune, db)
  yield call(mod.value.prune, db)
  yield call(mod.photo.prune, db)
  yield call(mod.selection.prune, db)
  yield call(mod.note.prune, db)
  yield call(mod.subject.prune, db)
  yield call(mod.access.prune, db)

  debug('*close terminated')
}


function *main() {
  let task
  let aux
  let crash

  try {
    aux = yield all([
      fork(ontology),
      fork(ipc),
      fork(history),
      fork(shell),
      fork(storage.start),
      fork(consolidator.run)
    ])

    yield all([
      call(storage.restore, 'recent'),
      call(storage.restore, 'settings'),
      call(storage.restore, 'ui')
    ])

    while (true) {
      let { type, payload, error } = yield take([OPEN, CLOSE])

      if (task != null && task.isRunning()) {
        yield cancel(task)
        yield race({
          closed: take(CLOSED),
          timeout: delay(FORCE_SHUTDOWN_DELAY)
        })

        task = null
      }

      if (type === CLOSE && !(error || payload === 'debug'))
        break

      if (type === OPEN) {
        task = yield fork(open, payload)
      }
    }

  } catch (error) {
    crash = error
    warn(`unexpected error in *main: ${error.message}`, {
      stack: error.stack
    })

  } finally {
    yield all([
      call(storage.persist, 'recent'),
      call(storage.persist, 'settings'),
      call(storage.persist, 'ui')
    ])

    yield all(aux.map(bg => {
      if (bg != null && bg.isRunning())
        return cancel(bg)
    }))

    if (crash != null)
      process.crash()

    debug('*main terminated')
  }
}

module.exports = {
  command,
  main,
  open
}
