'use strict'

const { takeEvery: every } = require('redux-saga')
const { put, select } = require('redux-saga/effects')
const { warn, debug } = require('../common/log')
const { undone, redone } = require('../selectors/history')
const { UNDO, REDO } = require('../constants/history')

module.exports = {

  *undo() {
    try {
      yield put(yield select(undone))

    } catch (error) {
      warn(`unexpected error in history:undo: ${error.message}`)
      debug(error.message, error.stack)
    }
  },

  *redo() {
    try {
      yield put(yield select(redone))

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
