import { ESPER, UI, SASS } from '../constants'
import { merge } from '../common/util'

const INIT = {
  esper: {
    height: 50,
    width: 50,
    tool: ESPER.TOOL.PAN,
    panel: false
  },
  panel: {
    slots: [
      { height: 40, isClosed: false },
      { height: 40, isClosed: false },
      { height: 20, isClosed: false }
    ],
    tab: 'metadata',
    width: SASS.PANEL.DEFAULT_WIDTH,
    zoom: 0
  },
  sidebar: {
    width: SASS.SIDEBAR.DEFAULT_WIDTH
  },
  zoom: 0
}

export function ui(state = INIT, { type, payload }) {
  switch (type) {
    case UI.RESTORE:
      return merge(INIT, payload)
    case UI.UPDATE:
      return merge(state, payload)
    default:
      return state
  }
}
