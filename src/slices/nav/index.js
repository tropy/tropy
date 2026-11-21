import { combineReducers } from '@reduxjs/toolkit'
import { expands } from '../../common/search.js'
import { restore, show } from './actions.js'
import searchReducer, { search, sort } from './search.js'
import selectionReducer, { clear, narrow } from './selection.js'
import modeReducer, { back } from './mode.js'

const slices = combineReducers({
  search: searchReducer,
  selection: selectionReducer,
  mode: modeReducer
})

export default function nav (state, action) {
  if (restore.match(action))
    return slices(undefined, action)

  let next = slices(state, action)

  // The one rule across slices (a cross-slice reducer):
  // a search change that may narrow the results clears the selections.
  if (state && next.search !== state.search &&
    narrows(state.search, next.search))
    next = {
      ...next,
      selection: selectionReducer(next.selection, clear())
    }

  return next
}

// Today's rules (widens replaces them in step 5): another view,
// a query that may match less, or tags added to the filter (AND).
const narrows = (prev, next) =>
  !isSameView(prev.view, next.view) ||
  (prev.query !== next.query && !expands(prev.query, next.query)) ||
  next.tags.some(id => !prev.tags.includes(id))

// Ids may be null or missing (e.g. a past activity, restored or not).
const isSameView = (a, b) =>
  a.name === b.name && a.type === b.type &&
  (a.id ?? null) === (b.id ?? null)

export { restore, show, search, sort, narrow }
export const mode = { back }
