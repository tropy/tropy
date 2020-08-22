import { LIST, SIDEBAR } from '../constants'
import { merge } from '../common/util'

const init = {
  expand: { 0: true }
}

export function sidebar(state = init, { type, payload, meta }) {
  switch (type) {
    case SIDEBAR.RESTORE:
      return merge(init, payload)
    case SIDEBAR.UPDATE:
      return merge(state, payload)

    case LIST.COLLAPSE:
      return {
        ...state,
        expand: { ...state.expand, [payload]: false }
      }
    case LIST.EXPAND:
      return {
        ...state,
        expand: { ...state.expand, [payload]: true }
      }
    case LIST.INSERT:
      return {
        ...state,
        expand: { ...state.expand, [payload.parent]: true }
      }
    case LIST.MOVE:
      return (meta.done || state.expand[payload.parent]) ? state : {
        ...state,
        expand: { ...state.expand, [payload.parent]: true }
      }

    default:
      return state
  }
}
