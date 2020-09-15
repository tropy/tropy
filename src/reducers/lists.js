import { LIST, PROJECT } from '../constants'
import { omit, splice } from '../common/util'
import { replace, update } from './util'

export function lists(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case PROJECT.OPEN:
      return {}
    case LIST.LOAD:
      return replace(state, payload, meta, error)

    case LIST.INSERT: {
      const parent = state[payload.parent]

      return {
        ...state,

        [parent.id]: {
          ...parent,
          children: splice(parent.children, meta.idx, 0, payload.id)
        },

        [payload.id]: payload
      }
    }

    case LIST.REMOVE: {
      const original = state[payload]
      const parent = state[original.parent]

      return {
        ...omit(state, [original.id]),

        [parent.id]: {
          ...parent,
          children: parent.children.filter(id => id !== original.id)
        }
      }
    }

    case LIST.UPDATE:
      return update(state, payload)
    default:
      return state
  }
}
