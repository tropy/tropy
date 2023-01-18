import { ITEM, PROJECT, LIST, METADATA } from '../constants'
import { into, map } from 'transducers.js'

import {
  load,
  insert,
  remove,
  replace,
  update,
  nested,
  bulk,
  touch
} from './util'


//eslint-disable-next-line complexity
function itemsReducer(state = {}, { type, payload, meta, error }) {
  switch (type) {
    case PROJECT.OPEN:
      return {}

    case ITEM.LOAD:
      return load(state, payload, meta, error)

    case ITEM.SPLIT:
    case ITEM.MERGE:
    case ITEM.IMPLODE:
      return (!meta.done || error) ?
        state :
        insert(state, payload)

    case ITEM.INSERT:
      return insert(state, payload)
    case ITEM.REMOVE:
      return remove(state, payload)
    case ITEM.UPDATE:
      return update(state, payload)

    case ITEM.EXPLODE:
      return (!meta.done || error) ?
        state :
        replace(state, payload)

    case ITEM.BULK.UPDATE:
      return bulk.update(state, payload, meta)

    case ITEM.TAG.INSERT:
      return nested.add('tags', state, payload, meta)
    case ITEM.TAG.REMOVE:
      return nested.remove('tags', state, payload, meta)

    case ITEM.PHOTO.ADD:
      return nested.add('photos', state, payload, meta)
    case ITEM.PHOTO.REMOVE:
      return nested.remove('photos', state, payload, meta)

    case LIST.ITEM.ADD:
    case LIST.ITEM.RESTORE: {
      if (error || !meta.done) return state

      const { id: list, items } = payload

      return into({ ...state }, map(id => ({
        [id]: { ...state[id], lists: [...state[id].lists, list] }
      })), items)
    }

    case LIST.ITEM.REMOVE: {
      if (error || !meta.done) return state

      const { id: list, items } = payload

      return into({ ...state }, map(id => ({
        [id]: {
          ...state[id],
          lists: state[id].lists.filter(lid => lid !== list)
        }
      })), items)
    }

    case METADATA.SAVE:
    case METADATA.RESTORE:
      return touch(state, payload, meta, error)

    default:
      return state
  }
}

export { itemsReducer as items }
