import { PROJECT, ITEM } from '../constants/index.js'
import ARGS, { update } from '../args.js'

const init = { name: '', items: 0 }

function dec(state, by = 1) {
  return { ...state, items: Math.max(0, state.items - by) }
}

function inc(state, by = 1) {
  return { ...state, items: state.items + by }
}

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
        file: payload,
        isReadOnly: meta.isReadOnly
      }
    case PROJECT.OPENED:
      // Update window's global ARGS to allow reloading the project!
      if (payload.file !== ARGS.file) {
        update({ file: payload.file })
      }
      return { ...payload }

    case PROJECT.CLOSE:
      // Clear project file if project was closed by user.
      if (payload === 'user') {
        update({ file: null })
      }
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
      return inc(state)
    case ITEM.RESTORE:
      return (!error && meta.done) ? inc(state, payload.length) : state
    case ITEM.DELETE:
      return (!error && meta.done) ? dec(state, payload.length) : state
    case ITEM.MERGE:
    case ITEM.IMPLODE:
      return (!error && meta.done) ? dec(state, meta.dec) : state
    case ITEM.EXPLODE:
    case ITEM.SPLIT:
      return (!error && meta.done) ? inc(state, meta.inc) : state
    default:
      return state
  }
}
