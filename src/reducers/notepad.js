import { merge } from '../common/util'
import { NOTEPAD } from '../constants'

const init = {}

export function notepad(state = init, { type, payload }) {
  switch (type) {
    case NOTEPAD.RESTORE:
      return merge(init, payload)
    case NOTEPAD.UPDATE:
      return merge(state, payload)
    default:
      return state
  }
}
