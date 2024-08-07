import { put, select, takeEvery as every } from 'redux-saga/effects'
import { warn } from '../common/log.js'
import { getUndo, getRedo } from '../selectors/index.js'
import { HISTORY } from '../constants/index.js'

function *undo() {
  try {
    let action = yield select(getUndo)
    if (action != null) yield put(action)

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *history:undo')
  }
}

function *redo() {
  try {
    let action = yield select(getRedo)
    if (action != null) yield put(action)

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *history:redo')
  }
}

export function *history() {
  yield every(HISTORY.UNDO, undo)
  yield every(HISTORY.REDO, redo)
}
