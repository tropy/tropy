import { PROJECT, RECENT } from '../constants/index.js'
import { merge } from '../common/util.js'

const INIT = {}

export function recent(state = INIT, { type, payload }) {
  switch (type) {
    case RECENT.RESTORE:
      return merge(INIT, payload)
    case PROJECT.OPENED: {
      let { id, file } = payload
      return merge(state, {
        [id]: { id, file, opened: Date.now() }
      })
    }
    default:
      return state
  }
}
