'use strict'

const { put, select, takeEvery: every } = require('redux-saga/effects')
const { warn, debug } = require('../common/log')
const { undo, redo } = require('../selectors/history')
const { UNDO, REDO } = require('../constants/history')

const history = {
  *undo() {
    try {
      const action = yield select(undo)
      if (action != null) yield put(action)

    } catch (error) {
      warn(`unexpected error in history:undo: ${error.message}`)
      debug(error.message, error.stack)
    }
  },

  *redo() {
    try {
      const action = yield select(redo)
      if (action != null) yield put(action)

    } catch (error) {
      warn(`unexpected error in history:undo: ${error.message}`)
      debug(error.message, error.stack)
    }
  },

  *history() {
    yield every(UNDO, history.undo)
    yield every(REDO, history.redo)
  }
}

module.exports = history
