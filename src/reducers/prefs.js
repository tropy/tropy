import { PREFS } from '../constants'

const defaults = { pane: 'app' }

export function prefs(state = defaults, { type, payload }) {
  switch (type) {
    case PREFS.RESTORE:
      return { ...defaults, ...payload }
    case PREFS.UPDATE:
      return { ...state, ...payload }
    default:
      return state
  }
}
