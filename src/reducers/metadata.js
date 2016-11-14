'use strict'

const { LOAD, UPDATE } = require('../constants/metadata')
const { ITEM, PHOTO, PROJECT } = require('../constants')
const { omit } = require('../common/util')

const init = {}

module.exports = {
  metadata(state = init, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPEN:
        return { ...init }

      case LOAD:
        return (meta.done && !error) ? { ...state, ...payload } : state

      case ITEM.REMOVE:
      case PHOTO.REMOVE:
        return omit(state, payload)

      case UPDATE: {
        const [id, data] = payload

        return {
          ...state,
          [id]: {
            ...state[id],
            ...data
          }
        }
      }

      default:
        return state
    }
  }
}
