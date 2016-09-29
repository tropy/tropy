'use strict'

const { takeEvery: every } = require('redux-saga')
const { fork, cancel, call, put, take } = require('redux-saga/effects')
const { OPEN } = require('../constants/project')
const { opened } = require('../actions/project')
const { drop } = require('../actions/history')
const { Database } = require('../common/db')
const { warn, info, debug } = require('../common/log')
const { ipc } = require('./ipc')
const { history } = require('./history')
const nav = require('./nav')
const list = require('../actions/list')
const { done } = require('../actions/activity')
const { exec } = require('../commands')
const { fail } = require('../notify')

const TOO_LONG = ARGS.dev ? 500 : 1500

function *open(file) {
  let db, id

  try {
    db = new Database(file)

    const project = yield call([db, db.get],
      'SELECT project_id AS id, name FROM project'
    )

    id = project.id

    yield put(opened({ file: db.path, ...project }))
    yield call(nav.restore, id)

    yield fork(init)

    yield* every(action => (
      !action.error && action.meta && action.meta.cmd
    ), command, db, id)


  } catch (error) {
    warn(`unexpected error in open: ${error.message}`)
    debug(error.stack)

  } finally {
    if (id) yield call(nav.persist, id)
    if (db) yield call([db, db.close])

    info(`closed project ${id}`)
  }
}

function *init() {
  yield [
    put(drop()),
    put(list.load())
  ]
}

function *command(db, id, action) {
  try {
    var cmd = yield exec(action, { db, id })

    yield put(done(action, cmd.error || cmd.result))

    if (cmd.error) fail(cmd.error, action.type)
    if (cmd.duration > TOO_LONG) warn('SLOW', cmd)

  } catch (error) {
    warn(`unexpected error in *command: ${error.message}`)
    debug(error.stack)
  }
}


module.exports = {
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

        task = yield fork(open, payload)
      }

    } catch (error) {
      warn(`unexpected error in main: ${error.message}`)
      debug(error.stack)
    }
  },

  open
}
