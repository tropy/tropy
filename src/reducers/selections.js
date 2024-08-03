import { METADATA, SELECTION, PROJECT } from '../constants/index.js'
import { bulk, insert, nested, replace, touch } from './util.js'
import * as tr from '../slices/transcriptions.js'

const init = {}

// eslint-disable-next-line complexity
export function selections(state = init, { type, payload, error, meta }) {
  switch (type) {
    case PROJECT.OPEN:
      return init

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

    case tr.create.type:
      return tr.nested.create(state, { payload, meta, error })
    case tr.remove.type:
      return tr.nested.remove(state, { payload, meta, error })
    case tr.restore.type:
      return tr.nested.restore(state, { payload, meta, error })

    case SELECTION.BULK.UPDATE:
      return bulk.update(state, payload, meta)

    case METADATA.SAVE:
    case METADATA.RESTORE:
      return touch(state, payload, meta, error)

    default:
      return state
  }
}
