import { FLASH } from '../constants'

const init = (ARGS.update && ARGS.update.id) ?
  [ARGS.update] : []

export function flash(state = init, { type, payload }) {
  switch (type) {
    case FLASH.SHOW:
      return [payload, ...state]
    case FLASH.HIDE:
      return state.filter(f => f.id !== payload.id)
    default:
      return state
  }
}
