'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { all } = require('../models/item')
const act = require('../actions')

module.exports = {

  *search(db) {
    try {
      const { nav, items } = yield select()
      const { list, tag, query, sort } = nav

      const ids = yield call(all, db, { list, tag, query, sort })
      verbose(`found ${ids}`)

      yield put(act.item.load(ids.filter(id => !(id in items))))
      yield put(act.ui.items.update(ids))

    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  }

}
