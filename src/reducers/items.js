'use strict'

const { omit } = require('../common/util')
const { ITEM, PROJECT, LIST } = require('../constants')
const { into, map } = require('transducers.js')
const { nested, pending } = require('./util')
const init = {}


module.exports = {
  //eslint-disable-next-line complexity
  items(state = init, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPEN:
        return { ...init }

      case ITEM.LOAD:
        return (meta.done && !error) ?
          { ...state, ...payload } : pending(state, payload)

      case ITEM.SPLIT:
      case ITEM.MERGE:
        if (!meta.done || error) return state
        // eslint-disable-line no-fallthrough
      case ITEM.INSERT:
        return {
          ...state,
          [payload.id]: payload
        }

      case ITEM.REMOVE:
        return omit(state, payload)

      case ITEM.UPDATE:
        return {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload
          }
        }

      case ITEM.BULK.UPDATE: {
        const [ids, data] = payload

        return into(
          { ...state },
          map(id => ({ [id]: { ...state[id], ...data } })),
          ids
        )
      }

      case ITEM.TAG.ADD:
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

      default:
        return state
    }
  }
}
