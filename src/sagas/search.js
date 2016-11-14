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
      const { list, tags, query, sort, trash } = nav

      const START = Date.now()

      const ids = yield call(all, db, { list, tags, query, sort, trash })

      verbose(`*search query took ${ms(Date.now() - START)}`)

      yield put(act.ui.items.update(ids))

      const missing = {
        items: [], metadata: []
      }

      for (let id of ids) {
        if (!(id in items)) missing.items.push(id)
        if (!(id in metadata)) missing.metadata.push(id)
      }

      yield [
        put(act.item.load(missing.items)),
        put(act.metadata.load(missing.metadata)),
        put(act.photo.load(missing.items)) // TODO temporary
      ]


    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  }

}
