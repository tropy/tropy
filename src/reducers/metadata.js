import {
  METADATA,
  ITEM,
  PHOTO,
  PROJECT,
  SELECTION
} from '../constants'

import {
  bulk,
  load,
  merge,
  remove,
  replace,
  insert,
  update
} from './util'


// eslint-disable-next-line complexity
export function metadata(state = {}, { type, payload, meta, error }) {
  switch (type) {
    case PROJECT.OPENED:
      return {}
    case METADATA.LOAD:
      return load(state, payload, meta, error)
    case METADATA.MERGE:
      return merge(state, payload, meta, error)
    case METADATA.REPLACE:
      return replace(state, payload)
    case METADATA.INSERT:
      return insert(state, payload)
    case METADATA.REMOVE:
      return bulk.remove(state, payload)

    case METADATA.UPDATE: {
      let { ids, data } = payload

      return (ids.length === 1) ?
        update(state, { ...data, id: ids[0] }, meta) :
        bulk.update(state, [ids, data], meta)
    }

    case SELECTION.CREATE:
      return (error || !meta.done) ? state : {
        ...state,
        [payload.id]: { id: payload.id }
      }

    case ITEM.REMOVE:
    case PHOTO.REMOVE:
      return remove(state, payload)

    default:
      return state
  }
}
