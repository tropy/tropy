import { merge } from '../common/util.js'
import { ESPER } from '../constants/index.js'

const init = {
  view: {}
}

export function esper(state = init, { type, payload }) {
  switch (type) {
    case ESPER.RESTORE:
      return merge(init, payload)
    case ESPER.UPDATE:
      return merge(state, payload)
    default:
      return state
  }
}
