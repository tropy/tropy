'use strict'

const { delay } = require('redux-saga')
const { call, cancel, fork, put, select, take } = require('redux-saga/effects')
const { getPhotosWithErrors } = require('../selectors')
const act = require('../actions')
const { warn } = require('../common/log')

const needsConsolidation = ({ meta }) =>
  !!meta.consolidate

const consolidator = {
  DELAY: 1000,

  *consolidate() {
    try {
      yield call(delay, consolidator.DELAY)

      const photos = yield select(getPhotosWithErrors)

      if (photos.length > 0) {
        yield put(act.photo.consolidate(photos, { force: true }))
      }

    } catch (error) {
      warn(`unexpected error in consolidate: ${error.message}`, {
        stack: error.stack
      })
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
