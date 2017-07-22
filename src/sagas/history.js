'use strict'

const { put, select, takeEvery: every } = require('redux-saga/effects')
const { warn, debug } = require('../common/log')
const { undone, redone } = require('../selectors/history')
const { UNDO, REDO } = require('../constants/history')

module.exports = {

  *undo() {
    try {
      const action = yield select(undone)
      if (action != null) yield put(action)

    } catch (error) {
      warn(`unexpected error in history:undo: ${error.message}`)
      debug(error.message, error.stack)
    }
  },

  *redo() {
    try {
      const action = yield select(redone)
      if (action != null) yield put(action)

    } catch (error) {
      warn(`unexpected error in history:undo: ${error.message}`)
      debug(error.message, error.stack)
    }
  },

  *history() {
    yield every(UNDO, module.exports.undo)
    yield every(REDO, module.exports.redo)
  }

}
