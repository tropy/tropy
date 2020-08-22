import { API, NOTE, PROJECT } from '../constants'
import { insert } from './util'

const init = {}

export function notes(state = init, { type, payload, error, meta }) {
  switch (type) {
    case PROJECT.OPEN:
      return { ...init }

    case API.NOTE.CREATE:
    case NOTE.CREATE:
    case NOTE.LOAD:
      return (meta.done && !error) ? { ...state, ...payload } : state

    case NOTE.INSERT:
      return insert(state, payload, meta)

    case NOTE.UPDATE:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          ...payload
        }
      }

    default:
      return state
  }
}
