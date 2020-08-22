import { omit } from '../common/util'
import { ACTIVITY } from '../constants'

export function activities(state = {}, { type, payload, meta = {} }) {
  const { cmd, rel, done } = meta

  switch (true) {
    case (type === ACTIVITY.UPDATE):
      return {
        ...state,
        [rel]: {
          ...state[rel],
          ...payload
        }
      }

    case (done):
      return omit(state, [rel])

    case (cmd != null):
      return {
        ...state,
        [meta.seq]: {
          id: meta.seq,
          type,
          init: meta.now,
          cancel: meta.cancel
        }
      }

    default:
      return state
  }
}
