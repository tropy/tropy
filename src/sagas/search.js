'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { all } = require('../models/item')
const act = require('../actions/ui')

module.exports = {

  *search(db) {
    try {
      const { list, tag, query } = yield select(({ nav }) => nav)
      const items = yield call(all, db, list, tag, query)

      yield put(act.items.update(items))

    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  }

}
