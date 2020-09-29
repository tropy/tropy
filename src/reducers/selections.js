import { METADATA, SELECTION, PROJECT } from '../constants'
import { bulk, insert, nested, replace, touch } from './util'

// eslint-disable-next-line complexity
export function selections(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case PROJECT.OPEN:
      return {}

    case SELECTION.LOAD:
      return (error || !meta.done) ? state : replace(state, payload)
    case SELECTION.CREATE:
      return (error || !meta.done) ? state : insert(state, payload)
    case SELECTION.INSERT:
      return insert(state, payload, meta)
    case SELECTION.SAVE:
      return (!meta.done || error) ?
        state : {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload,
            modified: new Date(meta.was)
          }
        }

    case SELECTION.NOTE.ADD:
      return nested.add('notes', state, payload, meta)
    case SELECTION.NOTE.REMOVE:
      return nested.remove('notes', state, payload, meta)

    case SELECTION.BULK.UPDATE:
      return bulk.update(state, payload, meta)

    case METADATA.SAVE:
    case METADATA.RESTORE:
      return touch(state, payload, meta, error)

    default:
      return state
  }
}
