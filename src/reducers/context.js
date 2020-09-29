import { CONTEXT } from '../constants'

export function context(state = {}, { type, payload }) {
  switch (type) {
    case CONTEXT.CLEAR:
      return {}
    case CONTEXT.SHOW:
      return payload
    default:
      return state
  }
}
