import { merge } from '../common/util.js'
import { PROJECT, ITEM } from '../constants/index.js'

const init = {
  name: '',
  optimize: {
    onImport: true,
    quality: 0.8
  }
}


export function project (state = init, { type, payload, meta, error }) {
  switch (type) {
    case PROJECT.RELOAD:
      return (!error && meta.done)
        ? { ...state, ...merge(init, payload) }
        : state

    case PROJECT.READY:
      return { ...state, isReady: true }

    case PROJECT.UPDATE:
      return { ...state, ...payload }

    case PROJECT.WARN:
      return state.warnings?.includes(payload) ? state : {
        ...state,
        warnings: [...(state.warnings ?? []), payload]
      }

    case PROJECT.OPEN:
      return {
        ...init,
        path: payload,
        isReadOnly: meta.isReadOnly
      }
    case PROJECT.OPENED:
      return merge(init, payload)

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
      return state.isBlank ? { ...state, isBlank: false } : state
    default:
      return state
  }
}
