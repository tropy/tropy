import { METADATA, PHOTO, PROJECT } from '../constants'
import { bulk, insert, load, nested, touch, update } from './util'
import * as tr from '../slices/transcriptions.js'


// eslint-disable-next-line complexity
export function photos(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case PROJECT.OPEN:
      return {}

    case PHOTO.LOAD:
      return load(state, payload, meta, error)

    case PHOTO.SAVE:
      return (!meta.done || error) ?
        state : {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload,
            modified: new Date(meta.was)
          }
        }

    case PHOTO.INSERT:
      return insert(state, payload, meta)
    case PHOTO.UPDATE:
      return update(state, payload, meta)

    case PHOTO.NOTE.ADD:
      return nested.add('notes', state, payload, meta)
    case PHOTO.NOTE.REMOVE:
      return nested.remove('notes', state, payload, meta)

    case tr.create.type:
      return tr.nested.create(state, { payload, meta, error })
    case tr.remove.type:
      return tr.nested.remove(state, { payload, meta, error })
    case tr.restore.type:
      return tr.nested.restore(state, { payload, meta, error })

    case PHOTO.SELECTION.ADD:
      return nested.add('selections', state, payload, meta)
    case PHOTO.SELECTION.REMOVE:
      return nested.remove('selections', state, payload, meta)

    case PHOTO.BULK.UPDATE:
      return bulk.update(state, payload, meta)

    case METADATA.SAVE:
    case METADATA.RESTORE:
      return touch(state, payload, meta, error)

    default:
      return state
  }
}
