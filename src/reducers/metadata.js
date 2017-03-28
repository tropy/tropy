'use strict'

const { METADATA, ITEM, PHOTO, PROJECT } = require('../constants')
const { omit } = require('../common/util')

const init = {}

module.exports = {
  metadata(state = init, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPEN:
        return { ...init }

      case METADATA.LOAD:
        return (meta.done && !error) ? { ...state, ...payload } : state

      case ITEM.REMOVE:
      case PHOTO.REMOVE:
        return omit(state, payload)

      case METADATA.INSERT:
        return { ...state, [payload.id]: payload }

      case METADATA.UPDATE: {
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
