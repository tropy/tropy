import { KEYMAP } from '../constants/index.js'

export function keymap(state = {}, { type, payload }) {
  switch (type) {
    case KEYMAP.UPDATE:
      return { ...state, ...payload }
    default:
      return state
  }
}
