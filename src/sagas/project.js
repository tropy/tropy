'use strict'

const { takeEvery: every } = require('redux-saga')
const { fork, cancel, call, put, take, select } = require('redux-saga/effects')
const { OPEN, PERSIST } = require('../constants/project')
const { update, opened, persist } = require('../actions/project')
const { drop, tick } = require('../actions/history')
const { Database } = require('../common/db')
const { warn, info, debug } = require('../common/log')
const { ipc } = require('./ipc')
const { history } = require('./history')
const nav = require('./nav')
const { LOAD } = require('../constants/list')
const list = require('../actions/list')
const { handle } = require('../commands')


const persistable = (action) =>
  action.meta && action.meta.persist

const retrievable = (action) =>
  action.meta && action.meta.retrieve

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
    yield put(drop())
    yield call(nav.restore, id)

    yield fork(every, retrievable, retrieval, db)
    yield put(list.load(null))

    yield* every(persistable, persistence, db, id)

  } catch (error) {
    warn(`unexpected error in open: ${error.message}`)
    debug(error.stack)

  } finally {
    if (id) yield call(nav.persist, id)
    if (db) yield call([db, db.close])

    info(`closed project ${id}`)
  }
}

function *retrieval(db, action) {
  const { type } = action

  try {
    switch (type) {
      case LOAD: {
        const res = yield call([db, db.all],
          'SELECT list_id AS id, name, parent_list_id AS parent, position FROM lists WHERE parent_list_id NOT NULL'
        )

        yield put(list.insert(res))

        break
      }
    }

  } catch (error) {
    warn(`unexpected error retrieval: ${error.message}`)
    debug(error.stack)
  }
}

function *persistence(db, id, action) {
  const { type, payload, meta } = action

  try {
    switch (type) {
      case PERSIST: {
        const { project: prev } = yield select()

        try {
          yield put(update(payload))
          yield call([db, db.run],
            'UPDATE project SET name = ? WHERE project_id = ?', payload.name, id
          )

        } catch (error) {
          yield put(update({ name: prev.name }))
          throw error
        }

        if (meta.history) {
          yield put(tick({ redo: action, undo: persist({ name: prev.name }) }))
        }

        break
      }

      default: {
        const cmd = handle(action, { db })
        yield cmd.execute()

        break
      }
    }

  } catch (error) {
    warn(`persistence saga failed: ${error.message}`)
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
