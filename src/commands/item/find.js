import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { ITEM } from '../../constants/index.js'
import { pluck } from '../../common/util.js'
import { getDefaultSort } from '../../selectors/nav.js'
import { find, ordered } from '../../sagas/search.js'

// Finds the items of a view, in the UI's order for the given sort.
// Read only: the view is explicit, not the one the user is looking at.
export class Find extends Command {
  *exec () {
    let { db } = this.options
    let { list, tags, trash, imports, query, sort } = this.action.payload

    sort = {
      column: sort?.column ?? getDefaultSort(list).column,
      asc: sort?.asc ?? true,
      locale: yield select(state => state.intl.locale)
    }

    let ids = yield* find(db, { list, tags, trash, imports, query })
    ids = yield* ordered(db, ids, sort)

    let items = yield select(state => state.items)
    return pluck(items, ids)
  }
}

Find.register(ITEM.FIND)
