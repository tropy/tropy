'use strict'

const { debug, warn } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { getSortColumn } = require('../selectors')
const mod = require('../models')
const act = require('../actions')

module.exports = {
  *search(db) {
    try {
      let { nav, imports, sort } = yield select(state => ({
        nav: state.nav,
        imports: state.imports,
        sort: getSortColumn(state)
      }))

      let { list, tags, trash, query } = nav

      let START = Date.now()

      let result

      switch (true) {
        case (nav.imports && imports.length > 0): {
          let ids = imports[0].items
          result = yield call(mod.item.find, db, { ids, query, sort })
          break
        }
        case (trash):
          result = yield call(mod.item.trash, db, { sort, query })
          break

        case (list != null):
          result = yield call(mod.item.list, db, list, { tags, query, sort })
          break

        default:
          result = yield call(mod.item.all, db, { tags, sort, query })
      }

      debug(`*search query took ${Date.now() - START}ms`)

      yield put(act.qr.update(result))

    } catch (error) {
      warn(`*search failed: ${error.message}`, {
        stack: error.stack
      })
    }
  }
}
