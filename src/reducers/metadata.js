'use strict'

const { LOAD, UPDATE } = require('../constants/metadata')
const { ITEM, PHOTO } = require('../constants')
const { omit } = require('../common/util')

module.exports = {
  metadata(state = {}, { type, payload, meta, error }) {
    switch (type) {
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
