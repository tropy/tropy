import { isList } from './view.js'
import { isPending } from '../cmd.js'
import { LIST } from '../../constants/index.js'
import { open, restored, select, viewShown } from './actions.js'
import modeSlice from './mode.js'
import searchSlice, { widens } from './search.js'
import selectSlice, { clearSelection, pruneSelection } from './select.js'
import { size } from '../../common/selection.js'

const initialState = {
  search: searchSlice.getInitialState(),
  select: selectSlice.getInitialState(),
  mode: modeSlice.getInitialState()
}

const isListItemRemove = isPending(LIST.ITEM.REMOVE)

const removeItemFromCurrentList = (action, view) =>
  isListItemRemove(action) && isList(view, action.payload.id)

// Cross-slice reducer:
// nav.mode, nav.search, nav.select.

export default function nav (state = initialState, action) {
  let search = searchSlice.reducer(state.search, action)
  let selection = state.select

  // If a search change isn't widening, we clear the selection.
  if (!restored.match(action) && !widens(state.search, search))
    selection = clearSelection(selection)

  selection = selectSlice.reducer(selection, action)

  // Items removed from the list shown leave the selection.
  if (removeItemFromCurrentList(action, search.view))
    selection = pruneSelection(selection, action.payload.items)

  let mode = modeSlice.reducer(state.mode, action)

  if (mode === 'item' && size(selection.item) === 0)
    mode = 'project'

  return (
    search === state.search &&
    selection === state.select &&
    mode === state.mode
  ) ? state : { search, select: selection, mode }
}

export {
  itemOpened,
  itemSelected,
  noteSelected,
  photoSelected
} from './actions.js'

export const {
  selectIsView,
  selectList,
  selectSort
} = searchSlice.getSelectors(state => state.nav.search)

export * from './selectors.js'

export const actions = {
  restore: restored,
  show: viewShown,
  search: searchSlice.actions.queryChanged,
  sort: searchSlice.actions.sortChanged,
  mode: {
    back: modeSlice.actions.itemClosed
  },
  select,
  open
}
