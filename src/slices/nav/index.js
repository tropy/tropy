import { combineReducers } from '@reduxjs/toolkit'
import { expands } from '../../common/search.js'
import { contains } from './view.js'
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

  // Cross-slice Reducer
  // Search changes that could narrow the results clear selections.
  if (state && next.search !== state.search &&
    !widens(state.search, next.search))
    next = {
      ...next,
      selection: selectionSlice.reducer(next.selection, clear())
    }

  return next
}

// Whether a search can only widen the results: the new view
// contains the old one, the new query expands the old one, and
// no tag was added to the filter (AND). The sort does not count.
const widens = (prev, next) =>
  contains(next.view, prev.view) &&
  (prev.query === next.query || expands(prev.query, next.query)) &&
  next.tags.every(id => prev.tags.includes(id))

export { restore, show }
export const { search, sort } = searchSlice.actions
export const { narrow } = selectionSlice.actions
export const mode = { back: modeSlice.actions.back }

export const {
  selectIsView,
  selectList,
  selectSort
} = searchSlice.getSelectors(state => state.nav.search)
