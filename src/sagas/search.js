'use strict'

const { warn, verbose } = require('../common/log')
const { call, put, select } = require('redux-saga/effects')
const { getSortColumn } = require('../selectors')
const mod = require('../models')
const act = require('../actions')
const ms = require('ms')

module.exports = {
  *search(db) {
    try {
      const { nav, imports, sort } = yield select(state => ({
        nav: state.nav,
        imports: state.imports,
        sort: getSortColumn(state)
      }))

      const { list, tags, trash, query } = nav

      const START = Date.now()

      let result

      switch (true) {
        case (nav.imports && imports.length > 0): {
          const ids = imports[0].items
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

      verbose(`*search query took ${ms(Date.now() - START)}`)

      yield put(act.qr.update(result))

    } catch (error) {
      warn(`unexpectedly failed in *search: ${error.message}`)
      verbose(error.stack)
    }
  }
}
