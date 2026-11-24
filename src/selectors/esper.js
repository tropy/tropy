import { BLANK, get } from '../common/util.js'
import { selectPhotoCursor } from '../slices/nav/selectors.js'

export const getEsperViewState = (state) =>
  get(state.esper.view, [selectPhotoCursor(state)], BLANK)
