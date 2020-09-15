import { TAG, PROJECT } from '../constants'
import { insert, load, remove, update } from './util'

export function tags(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case PROJECT.OPEN:
      return {}
    case TAG.LOAD:
      return load(state, payload, meta, error)
    case TAG.CREATE:
      return (!meta.done || error) ?
        state : insert(state, payload)
    case TAG.INSERT:
      return insert(state, payload, meta)
    case TAG.DELETE:
      return (!meta.done || error) ?
        state : remove(state, [payload], meta, error)
    case TAG.UPDATE:
      return update(state, payload)
    default:
      return state
  }
}
