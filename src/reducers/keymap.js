import { KEYMAP } from '../constants'

export function keymap(state = {}, { type, payload }) {
  switch (type) {
    case KEYMAP.UPDATE:
      return { ...state, ...payload }
    default:
      return state
  }
}
