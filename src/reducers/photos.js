'use strict'

const { PHOTO, PROJECT } = require('../constants')
const { into, map } = require('transducers.js')
const { nested } = require('./util')

const init = {}

module.exports = {
  // eslint-disable-next-line complexity
  photos(state = init, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return { ...init }

      case PHOTO.LOAD:
        return (meta.done && !error) ? { ...state, ...payload } : state

      case PHOTO.CREATE:
        return (meta.done && !error) ?
          { ...state, [payload.id]: payload } :
          state

      case PHOTO.INSERT:
        return { ...state, [payload.id]: payload }

      case PHOTO.UPDATE:
        return {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload
          }
        }

      case PHOTO.NOTE.ADD:
        return nested.add('notes', state, payload, meta)
      case PHOTO.NOTE.REMOVE:
        return nested.remove('notes', state, payload, meta)


      case PHOTO.BULK.UPDATE: {
        const [ids, data] = payload

        return into(
          { ...state },
          map(id => ({ [id]: { ...state[id], ...data } })),
          ids
        )
      }


      default:
        return state
    }
  }
}
