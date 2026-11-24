import { BLANK, get } from '../common/util.js'
import { selectPhotoCursor, selectSelectionCursor } from '../slices/nav/selectors.js'

export const getEsperViewState = (state) =>
  get(state.esper.view, [
    selectSelectionCursor(state) ?? selectPhotoCursor(state)
  ], BLANK)
