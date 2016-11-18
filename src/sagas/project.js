'use strict'

const { takeEvery: every } = require('redux-saga')
const { fork, cancel, call, put, take } = require('redux-saga/effects')
const { OPEN } = require('../constants/project')
const { Database } = require('../common/db')
const { Cache } = require('../common/cache')
const { warn, info, debug, verbose } = require('../common/log')
const { exec } = require('../commands')
const { fail } = require('../dialog')
const { ipc } = require('./ipc')
const { history } = require('./history')
const { search, load } = require('./search')
const mod = require('../models')
const act = require('../actions')
const nav = require('./nav')

const TOO_LONG = ARGS.dev ? 500 : 1500

const has = (condition, { error, meta }) => (
  !error && meta && (!meta.async || meta.done) && meta[condition]
)

module.exports = {

  *open(file) {
    try {
      var db = new Database(file)

      const project = yield call(mod.project.load, db)
      var { id } = project
      const cache = new Cache(ARGS.cache, id)

      yield call([cache, cache.init])
      yield put(act.project.opened({ file: db.path, ...project }))

      yield every(action => has('search', action), search, db)
      yield every(action => has('load', action), load)

      yield call(nav.restore, id)

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

      yield* every(action => (
        !action.error && action.meta && action.meta.async
      ), module.exports.command, { db, id, cache })


    } catch (error) {
      warn(`unexpected error in open: ${error.message}`)
      debug(error.stack)

    } finally {
      if (id) yield call(nav.persist, id)
      if (db) {
        yield [
          call(mod.list.prune, db),
          call(mod.tag.prune, db),
          call(mod.value.prune, db),
          call(mod.photo.prune, db)
        ]

        yield call([db, db.close])
      }

      info(`closed project ${id}`)
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
    let task

    try {
      yield fork(ipc)
      yield fork(history)

      while (true) {
        const { payload } = yield take(OPEN)

        if (task) {
          yield cancel(task)
        }

        task = yield fork(module.exports.open, payload)
      }

    } catch (error) {
      warn(`unexpected error in main: ${error.message}`)
      debug(error.stack)
    }
  }
}
