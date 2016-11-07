'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { all } = require('../models/item')
const act = require('../actions')
const ms = require('ms')

module.exports = {

  *search(db) {
    try {
      const { nav, metadata, items } = yield select()
      const { list, tag, query, sort, trash } = nav

      const START = Date.now()

      const ids = yield call(all, db, { list, tag, query, sort, trash })

      verbose(`*search query took ${ms(Date.now() - START)}`)

      yield put(act.ui.items.update(ids))

      yield [
        put(act.item.load(ids.filter(id => !(id in items)))),
        put(act.metadata.load(ids.filter(id => !(id in metadata))))
      ]


    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  }

}
