'use strict'

const { put, select, takeEvery: every } = require('redux-saga/effects')
const { warn } = require('../common/log')
const { undo, redo } = require('../selectors/history')
const { UNDO, REDO } = require('../constants/history')

const history = {
  *undo() {
    try {
      let action = yield select(undo)
      if (action != null) yield put(action)

    } catch (e) {
      warn({ stack: e.stack }, 'unexpected error in *history:undo')
    }
  },

  *redo() {
    try {
      let action = yield select(redo)
      if (action != null) yield put(action)

    } catch (e) {
      warn({ stack: e.stack }, 'unexpected error in *history:redo')
    }
  },

  *history() {
    yield every(UNDO, history.undo)
    yield every(REDO, history.redo)
  }
}

module.exports = history
