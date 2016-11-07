'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { all, deleted } = require('../models/item')
const act = require('../actions')

module.exports = {

  *search(db) {
    try {
      const { nav, metadata } = yield select()
      const { list, tag, query, sort, trash } = nav

      const ids =
        yield call(trash ? deleted : all, db, { list, tag, query, sort })

      yield put(act.metadata.load(ids.filter(id => !(id in metadata))))
      yield put(act.ui.items.update(ids))

    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  }

}
