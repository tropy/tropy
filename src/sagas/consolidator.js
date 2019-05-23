'use strict'

const { cancel, delay, fork, put, select, take } = require('redux-saga/effects')
const { getPhotosWithErrors } = require('../selectors')
const act = require('../actions')
const { warn } = require('../common/log')

const needsConsolidation = ({ meta }) =>
  !!meta.consolidate

const consolidator = {
  DELAY: 1000,

  *consolidate() {
    try {
      yield delay(consolidator.DELAY)

      const photos = yield select(getPhotosWithErrors)

      if (photos.length > 0) {
        yield put(act.photo.consolidate(photos, { force: true }))
      }

    } catch (e) {
      warn({ stack: e.stack }, 'unexpected error in *consolidate')
    }
  },

  *run() {
    let task

    while (true) {
      yield take(needsConsolidation)
      if (task) {
        yield cancel(task)
      }
      task = yield fork(consolidator.consolidate)
    }
  }
}

module.exports = consolidator
