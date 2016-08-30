'use strict'

const { takeEvery: every } = require('redux-saga')
const { call, select, put } = require('redux-saga/effects')
const { SAVE } = require('../constants/project')
const { update } = require('../actions/project')
const { Database } = require('../common/db')

function *save({ payload }) {
  const { project } = yield select()
  const db = Database.cached(project.file)

  yield call([db, db.run],
    'UPDATE project SET name = ? WHERE project_id = ?', payload.name, project.id
  )

  yield put(update(payload))
}

module.exports = {
  *project() {
    yield* every(SAVE, save)
  }
}
