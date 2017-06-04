'use strict'

const { ITEM, PROJECT, LIST } = require('../constants')
const { into, map } = require('transducers.js')
const { load, insert, remove, replace, update, nested, bulk } = require('./util')


module.exports = {
  //eslint-disable-next-line complexity
  items(state = {}, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}

      case ITEM.LOAD:
        return load(state, payload, meta, error)

      case ITEM.SPLIT:
      case ITEM.MERGE:
        if (!meta.done || error) return state
        // eslint-disable-line no-fallthrough
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

      case ITEM.TAG.CREATE:
        if (!meta.done || error) return state
        // eslint-disable-line no-fallthrough
      case ITEM.TAG.INSERT:
        return nested.add('tags', state, payload, meta)
      case ITEM.TAG.DELETE:
        if (!meta.done || error) return state
        // eslint-disable-line no-fallthrough
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

      default:
        return state
    }
  }
}
