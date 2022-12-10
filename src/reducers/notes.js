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
    case NOTE.RESTORE:
      return (meta.done && !error) ? { ...state, ...payload } : state

    case NOTE.INSERT:
      return insert(state, payload, meta)

    case NOTE.UPDATE:
      return (meta.done && !error) ? {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          ...payload,
          changed: true
        }
      } : state

    case NOTE.SAVE:
      return (meta.done && !error) ? {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          changed: false
        }
      } : state

    default:
      return state
  }
}
