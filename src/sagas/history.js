'use strict'

const { takeEvery: every } = require('redux-saga')
const { fork, put, select } = require('redux-saga/effects')
const { warn, debug } = require('../common/log')
const { UNDO, REDO } = require('../constants/history')

module.exports = {

  *undo() {
    try {
      const { history: { future } } = yield select()
      yield put(future[0].undo)

    } catch (error) {
      warn(`unexpected error in history:undo: ${error.message}`)
      debug(error.message, error.stack)
    }
  },

  *redo() {
    try {
      const { history: { past } } = yield select()
      yield put(past[0].redo)

    } catch (error) {
      warn(`unexpected error in history:undo: ${error.message}`)
      debug(error.message, error.stack)
    }
  },

  *history() {
    yield fork(every, UNDO, module.exports.undo)
    yield fork(every, REDO, module.exports.redo)
  }

}
