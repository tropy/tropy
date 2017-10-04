'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { get } = require('../common/util')
const mod = require('../models/item')
const act = require('../actions')
const ms = require('ms')

module.exports = {

  // eslint-disable-next-line complexity
  *search(db) {
    try {
      const { nav } = yield select()
      const { list, tags, trash, sort, lists, query } = nav

      const START = Date.now()

      let result

      switch (true) {
        case (trash):
          result = yield call(mod.trash, db, { sort, query })
          break

        case (list != null):
          result = yield call(mod.list, db, list, {
            tags,
            query,
            sort: get(lists, [list, 'sort']) || sort
          })

          break

        default:
          result = yield call(mod.all, db, { tags, sort, query })
      }

      verbose(`*search query took ${ms(Date.now() - START)}`)

      yield put(act.qr.items.update(result))

    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  }
}
