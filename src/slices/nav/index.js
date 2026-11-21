import { combineReducers } from '@reduxjs/toolkit'
import { expands } from '../../common/search.js'
import { restore, show } from './actions.js'
import { searchSlice } from './search.js'
import { selectionSlice } from './selection.js'
import { modeSlice } from './mode.js'

const slices = combineReducers({
  search: searchSlice.reducer,
  selection: selectionSlice.reducer,
  mode: modeSlice.reducer
})

const { clear } = selectionSlice.actions

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
      selection: selectionSlice.reducer(next.selection, clear())
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

export { restore, show }
export const { search, sort } = searchSlice.actions
export const { narrow } = selectionSlice.actions
export const mode = { back: modeSlice.actions.back }

export const {
  selectIsView,
  selectList,
  selectSort
} = searchSlice.getSelectors(state => state.nav.search)
