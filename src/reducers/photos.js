'use strict'

const { PHOTO, PROJECT } = require('../constants')

const { omit } = require('../common/util')
const { into, map } = require('transducers.js')
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

      case PHOTO.REMOVE:
        return omit(state, [payload])

      case PHOTO.UPDATE:
        return {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload
          }
        }

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
