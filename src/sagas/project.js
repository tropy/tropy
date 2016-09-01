'use strict'

const { takeEvery: every } = require('redux-saga')
const { fork, cancel, call, put, take, select } = require('redux-saga/effects')
const { OPEN, PERSIST } = require('../constants/project')
const { update, opened } = require('../actions/project')
const { Database } = require('../common/db')
const { verbose, warn, info, debug } = require('../common/log')
const { ipc } = require('./ipc')
const nav = require('./nav')


const persistable = (action) =>
  action.meta && action.meta.persist


function *open(file) {
  let db, id

  try {
    db = new Database(file)

    const project = yield call([db, db.get],
      'SELECT project_id AS id, name FROM project'
    )

    id = project.id
    info(`opened project ${id}`)

    yield put(opened({ file: db.path, ...project }))
    yield call(nav.restore, id)

    yield* every(persistable, persist, db, id)

  } catch (error) {
    warn(`unexpected error in open: ${error.message}`)
    debug(error)

  } finally {
    if (id) yield call(nav.persist, id)
    if (db) yield call([db, db.close])

    info(`closed project ${id}`)
  }
}


function *persist(db, id, { type, payload }) {
  try {
    if (type !== PERSIST) return
    verbose(type, payload)

    const { project: prev } = yield select()

    yield put(update(payload))

    try {
      yield call([db, db.run],
        'UPDATE project SET name = ? WHERE project_id = ?', payload.name, id
      )

    } catch (error) {
      yield put(update({ name: prev.name }))
      throw error
    }

  } catch (error) {
    warn(`persist saga failed: ${error.message}`)
    debug(error)
  }
}


module.exports = {
  *main() {
    let task

    try {
      yield fork(ipc)

      while (true) {
        const { payload } = yield take(OPEN)

        if (task) {
          yield cancel(task)
        }

        task = yield fork(open, payload)
      }

    } catch (error) {
      warn(`unexpected error in main: ${error.message}`)
      debug(error)
    }
  },

  open
}
