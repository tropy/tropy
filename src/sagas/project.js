'use strict'

const { takeEvery: every } = require('redux-saga')
const { fork, cancel, call, put, take } = require('redux-saga/effects')
const { OPEN, OPENED, SAVE } = require('../constants/project')
const { update, opened } = require('../actions/project')
const { persist, restore } = require('../actions/nav')
const { Database } = require('../common/db')
const { warn, info, debug } = require('../common/log')
const { ipcRenderer: ipc } = require('electron')


function *open(file) {
  let db, id

  try {
    db = new Database(file)

    const project = yield call([db, db.get],
      'SELECT project_id AS id, name FROM project'
    )

    id = project.id

    info(`opened project ${id}`)
    ipc.send(OPENED, { file: db.path, id })

    yield put(restore(id))
    yield put(opened({ file: db.path, ...project }))

    yield* every(SAVE, save, db, id)

  } catch (error) {
    warn(`unexpected error in open: ${error.message}`)
    debug(error)

  } finally {
    if (id) yield put(persist(id))
    if (db) yield call([db, db.close])

    info(`closed project ${id}`)
  }
}


function *save(db, id, { payload }) {
  try {
    yield call([db, db.run],
      'UPDATE project SET name = ? WHERE project_id = ?', payload.name, id
    )

    yield put(update(payload))

  } catch (error) {
    warn(`save saga failed: ${error.message}`)
    debug(error)
  }
}


module.exports = {
  *main() {
    let task

    try {
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
