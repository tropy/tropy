'use strict'

const { OPEN, CLOSE, CLOSED, MIGRATIONS } = require('../constants/project')
const { Database } = require('../common/db')
const { Cache } = require('../common/cache')
const { warn, debug, verbose } = require('../common/log')
const { ipc } = require('./ipc')
const { history } = require('./history')
const { search, load } = require('./search')
const { ontology } = require('./ontology')
const { exec } = require('./cmd')
const mod = require('../models')
const act = require('../actions')
const storage = require('./storage')

const {
  all, fork, cancel, cancelled, call, put, take, takeEvery: every
} = require('redux-saga/effects')


const has = (condition) => (({ error, meta }) =>
  (!error && meta && (!meta.cmd || meta.done) && meta[condition]))

const command = ({ error, meta }) =>
  (!error && meta && meta.cmd === 'project')


function *open(file) {
  try {
    var db = new Database(file, 'w')

    db.on('error', error => {
      warn(`unexpected database error: ${error.message}`)
      debug(error.stack)
    })

    yield call(db.migrate, MIGRATIONS)

    var project = yield call(mod.project.load, db)
    var access  = yield call(mod.access.open, db)

    const cache = new Cache(ARGS.cache, project.id)

    if (db.path !== ARGS.file) {
      ARGS.file = db.path
      window.location.hash = encodeURIComponent(JSON.stringify(ARGS))
    }

    yield call([cache, cache.init])
    yield put(act.project.opened({ file: db.path, ...project }))

    yield every(has('search'), search, db)
    yield every(has('load'), load)

    yield all([
      call(storage.restore, 'nav', project.id),
      call(storage.restore, 'columns', project.id)
    ])

    yield fork(function* () {
      yield all([
        put(act.history.drop()),
        put(act.list.load()),
        put(act.tag.load())
      ])

      yield call(search, db)
      yield call(load, db)
    })

    while (true) {
      const action = yield take(command)
      yield fork(exec, { db, id: project.id, cache }, action)
    }


  } catch (error) {
    warn(`unexpected error in open: ${error.message}`)
    debug(error.stack)

  } finally {
    if (project.id) {
      yield all([
        call(storage.persist, 'nav', project.id),
        call(storage.persist, 'columns', project.id)
      ])
    }

    if (db) {
      if (access != null && access.id > 0) {
        yield call(mod.access.close, db, access.id)
      }

      yield all([
        call(mod.item.prune, db),
        call(mod.list.prune, db),
        call(mod.value.prune, db),
        call(mod.photo.prune, db),
        call(mod.note.prune, db),
        call(mod.access.prune, db)
      ])

      yield call(db.close)
    }

    yield put(act.project.closed(project.id))
  }
}


function *main() {
  let task
  let aux

  try {
    aux = yield all([
      fork(ontology),
      fork(ipc),
      fork(history),
      fork(storage.start)
    ])

    yield all([
      call(storage.restore, 'settings'),
      call(storage.restore, 'ui')
    ])

    while (true) {
      const { type, payload } = yield take([OPEN, CLOSE])

      if (task) {
        yield cancel(task)
        yield take(CLOSED)
      }

      if (type === CLOSE) return

      task = yield fork(open, payload)
    }

  } catch (error) {
    warn(`unexpected error in *main: ${error.message}`)
    debug(error.stack)

  } finally {
    yield all([
      call(storage.persist, 'settings'),
      call(storage.persist, 'ui')
    ])

    if (!(yield cancelled())) {
      yield all(aux.map(t => cancel(t)))
    }

    verbose('*main terminated')
  }
}

module.exports = {
  command,
  main,
  open
}
