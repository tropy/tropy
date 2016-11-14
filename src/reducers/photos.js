'use strict'

const { PHOTO, PROJECT } = require('../constants')

const { omit } = require('../common/util')
const init = {}

module.exports = {
  photos(state = init, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return { ...init }

      case PHOTO.LOAD:
        return (meta.done && !error) ? { ...state, ...payload } : state

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

      default:
        return state
    }
  }
}
