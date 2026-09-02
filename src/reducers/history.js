import { HISTORY } from '../constants/index.js'


function target ({ payload }) {
  return payload.id ?? payload.item ?? payload.photo
}

function canMerge (a, b) {
  if (a.type !== b.type)
    return false

  let id = target(a)
  return id != null && id === target(b)
}

export function history (state = { past: [], future: [] }, {
  type,
  payload,
  meta
}) {
  switch (type) {
    case HISTORY.UNDO:
      return {
        past: state.past.slice(1),
        future: [state.past[0], ...state.future]
      }
    case HISTORY.REDO:
      return {
        past: [state.future[0], ...state.past],
        future: state.future.slice(1)
      }
    case HISTORY.TICK:
      if (meta.mode === 'merge' && state.past.length) {
        const { undo } = state.past[0]

        if (canMerge(undo, payload.undo)) {
          return {
            past: [{ ...payload, undo }, ...state.past.slice(1)],
            future: []
          }
        }
      }

      return {
        past: [payload, ...state.past],
        future: []
      }

    case HISTORY.DROP:
      return {
        past: [],
        future: []
      }
    default:
      return state
  }
}
