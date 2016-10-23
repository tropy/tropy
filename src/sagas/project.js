'use strict'

const { takeEvery: every } = require('redux-saga')
const { fork, cancel, call, put, take } = require('redux-saga/effects')
const { OPEN } = require('../constants/project')
const { Database } = require('../common/db')
const { warn, info, debug, verbose } = require('../common/log')
const { exec } = require('../commands')
const { fail } = require('../notify')
const { ipc } = require('./ipc')
const { history } = require('./history')
const mod = require('../models')
const act = require('../actions')
const nav = require('./nav')

const TOO_LONG = ARGS.dev ? 500 : 1500


module.exports = {

  *open(file) {
    try {
      var db = new Database(file)

      const project = yield call(mod.project.load, db)
      var { id } = project

      yield put(act.project.opened({ file: db.path, ...project }))
      yield call(nav.restore, id)

      yield fork(function* () {
        yield [
          call(mod.project.touch, db, { id }),
          put(act.history.drop()),
          put(act.list.load()),
          put(act.tag.load())
        ]
      })

      yield* every(action => (
        !action.error && action.meta && action.meta.async
      ), module.exports.command, db, id)


    } catch (error) {
      warn(`unexpected error in open: ${error.message}`)
      debug(error.stack)

    } finally {
      if (id) yield call(nav.persist, id)
      if (db) {
        yield [
          call(mod.list.prune, db),
          call(mod.tag.prune, db)
        ]

        yield call([db, db.close])
      }

      info(`closed project ${id}`)
    }
  },


  *command(db, id, action) {
    try {
      const cmd = yield exec(action, { db, id })

      yield put(act.activity.done(action, cmd.error || cmd.result))

      if (action.meta.record && cmd.isomorph) {
        yield put(act.history.tick(cmd.history()))
      }

      if (cmd.error) {
        fail(cmd.error, action.type)
      }

      if (cmd.duration > TOO_LONG) {
        warn(`SLOW: ${action.type}`, cmd)
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
