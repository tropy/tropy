'use strict'

const { OPEN, CLOSE, CLOSED } = require('../constants/project')
const { Database } = require('../common/db')
const { Cache } = require('../common/cache')
const { warn, debug, verbose } = require('../common/log')
const { exec } = require('../commands')
const { fail } = require('../dialog')
const { ipc } = require('./ipc')
const { history } = require('./history')
const { search, load } = require('./search')
const mod = require('../models')
const act = require('../actions')
const storage = require('./storage')

const {
  fork, cancel, cancelled, call, put, take, takeEvery: every
} = require('redux-saga/effects')

const TOO_LONG = ARGS.dev ? 500 : 1500

const has = (condition, { error, meta }) => (
  !error && meta && (!meta.async || meta.done) && meta[condition]
)

module.exports = {

  *open(file) {
    try {
      var db = new Database(file, 'w')

      db.on('error', error => {
        warn(`unexpected database error: ${error.message}`)
        debug(error.stack)

        throw error
      })

      const project = yield call(mod.project.load, db)

      var { id } = project
      const cache = new Cache(ARGS.cache, id)

      yield call([cache, cache.init])
      yield put(act.project.opened({ file: db.path, ...project }))

      yield every(action => has('search', action), search, db)
      yield every(action => has('load', action), load)

      yield [
        call(storage.restore, 'nav', id),
        call(storage.restore, 'columns', id)
      ]

      yield fork(function* () {
        yield [
          call(mod.project.touch, db, { id }),
          put(act.history.drop()),
          put(act.list.load()),
          put(act.tag.load())
        ]

        yield call(search, db)
        yield call(load, db)
      })

      while (true) {
        const action = yield take(a => (!a.error && a.meta && a.meta.async))
        yield fork(module.exports.command, { db, id, cache }, action)
      }


    } catch (error) {
      warn(`unexpected error in open: ${error.message}`)
      debug(error.stack)

    } finally {
      if (id) {
        yield [
          call(storage.persist, 'nav', id),
          call(storage.persist, 'columns', id)
        ]
      }

      if (db) {
        yield [
          call(mod.item.prune, db),
          call(mod.list.prune, db),
          call(mod.tag.prune, db),
          call(mod.value.prune, db),
          call(mod.photo.prune, db),
          call(mod.note.prune, db)
        ]

        yield call(db.close)
      }

      yield put(act.project.closed(id))
    }
  },


  *command({ db, id, cache }, action) {
    try {
      const cmd = yield exec(action, { db, id, cache })

      yield put(act.activity.done(action, cmd.error || cmd.result))

      if (action.meta.record && cmd.isomorph) {
        yield put(act.history.tick(cmd.history()))
      }

      if (cmd.error) {
        fail(cmd.error, action.type)
      }

      if (cmd.duration > TOO_LONG) {
        warn(`SLOW: ${action.type}`)
      }

    } catch (error) {
      warn(`${action.type} unexpectedly failed in *command: ${error.message}`)
      verbose(error.stack)
    }
  },

  *main() {
    let task, aux

    try {
      aux = yield [
        fork(ipc),
        fork(history)
      ]

      yield [
        call(storage.restore, 'properties'),
        call(storage.restore, 'ui')
      ]

      while (true) {
        const { type, payload } = yield take([OPEN, CLOSE])

        if (task) {
          yield cancel(task)
          yield take(CLOSED)
        }

        if (type === CLOSE) return

        task = yield fork(module.exports.open, payload)
      }

    } catch (error) {
      warn(`unexpected error in *main: ${error.message}`)
      debug(error.stack)

    } finally {
      yield [
        call(storage.persist, 'properties'),
        call(storage.persist, 'ui')
      ]

      if (!(yield cancelled())) {
        yield aux.map(cancel)
      }

      verbose('*main terminated')
    }
  }
}
