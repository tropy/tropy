import { call, put, select } from 'redux-saga/effects'
import { warn } from '../common/log.js'
import { getSortColumn } from '../selectors/index.js'
import * as mod from '../models/index.js'
import * as act from '../actions/index.js'

export function *search(db) {
  try {
    let { nav, imports, sort } = yield select(state => ({
      nav: state.nav,
      imports: state.imports,
      sort: getSortColumn(state)
    }))

    var { list, tags, trash, query } = nav

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
        if (list < 0)
          result = yield call(mod.item.unlisted, db, { tags, query, sort })
        else
          result = yield call(mod.item.list, db, list, { tags, query, sort })
        break

      default:
        result = yield call(mod.item.all, db, { tags, sort, query })
    }

    let ms = Date.now() - START
    if (ms > 300) {
      warn({
        ms,
        list,
        query,
        tags: tags.length > 0,
        trash
      }, `SLOW: *search query "${query}" took ${ms}ms`)
    }

    yield put(act.qr.update(result))

  } catch (e) {
    warn({
      list,
      query,
      tags: tags.length > 0,
      stack: e.stack,
      trash
    }, '*search failed')
  }
}

