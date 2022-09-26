import { PROJECT, ITEM } from '../constants/index.js'

const init = { name: '' }

// eslint-disable-next-line complexity
export function project(state = init, { type, payload, meta, error }) {
  switch (type) {
    case PROJECT.RELOAD:
      return (!error && meta.done) ? { ...payload } : state
    case PROJECT.UPDATE:
      return { ...state, ...payload }
    case PROJECT.OPEN:
      return {
        ...init,
        path: payload,
        isReadOnly: meta.isReadOnly
      }
    case PROJECT.OPENED:
      return { ...payload }

    case PROJECT.CLOSE:
      return {
        ...state,
        closedBy: payload,
        isReadOnly: true,
        isClosing: true
      }
    case PROJECT.CLOSED:
      return (error || state.closedBy === 'user') ? init : {
        ...state,
        isClosing: false,
        closed: new Date()
      }

    case ITEM.INSERT:
      return (state.lastAccess == null) ?
        state.lastAccess = Date.now() : state

    default:
      return state
  }
}
