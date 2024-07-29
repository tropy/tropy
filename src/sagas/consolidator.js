import { cancel, delay, fork, put, select, take } from 'redux-saga/effects'
import { getPhotosWithErrors } from '../selectors/index.js'
import * as act from '../actions/index.js'
import { warn } from '../common/log.js'

const needsConsolidation = ({ meta }) =>
  !!meta.consolidate

const DELAY = 1000

export function *consolidate() {
  try {
    yield delay(DELAY)

    let photos = yield select(getPhotosWithErrors)

    if (photos.length > 0) {
      yield put(act.photo.consolidate(photos, { force: true }))
    }

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *consolidate')
  }
}

export function *consolidator() {
  let task

  while (true) {
    yield take(needsConsolidation)
    if (task) {
      yield cancel(task)
    }
    task = yield fork(consolidate)
  }
}
