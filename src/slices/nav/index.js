import { expands } from '../../common/search.js'
import { contains, isList } from './view.js'
import { isPending } from '../cmd.js'
import { LIST } from '../../constants/index.js'
import { restore, show } from './actions.js'
import modeSlice from './mode.js'
import searchSlice from './search.js'
import selectionSlice, { clearSelection, pruneSelection } from './selection.js'

const initialState = {
  search: searchSlice.getInitialState(),
  selection: selectionSlice.getInitialState(),
  mode: modeSlice.getInitialState()
}

const isListItemRemove = isPending(LIST.ITEM.REMOVE)

const removeItemFromCurrentList = (action, view) =>
  isListItemRemove(action) && isList(view, action.payload.id)

export default function nav (state = initialState, action) {
  let search = searchSlice.reducer(state.search, action)
  let selection = state.selection

  // If a search change isn't widening, we clear the selection.
  if (!restore.match(action) && !widens(state.search, search))
    selection = clearSelection(selection)

  selection = selectionSlice.reducer(selection, action)

  // Items removed from the list shown leave the selection.
  if (removeItemFromCurrentList(action, search.view))
    selection = pruneSelection(selection, action.payload.items)

  let mode = modeSlice.reducer(state.mode, action)

  return (
    search === state.search &&
    selection === state.selection &&
    mode === state.mode
  ) ? state : { search, selection, mode }
}

// Whether a search change can only widen the results.
function widens (prev, next) {
  if (prev === next)
    return true

  // The new view must contain the old one.
  if (!contains(next.view, prev.view))
    return false

  // The new query must expand on the old one.
  if (prev.query !== next.query && !expands(prev.query, next.query))
    return false

  // No tag added to the filter (tags combine with AND).
  if (next.tags.some(id => !prev.tags.includes(id)))
    return false

  return true
}

export { restore, show }
export const { search, sort } = searchSlice.actions
export const mode = { back: modeSlice.actions.back }

export const {
  selectIsView,
  selectList,
  selectSort
} = searchSlice.getSelectors(state => state.nav.search)
