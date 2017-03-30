'use strict'

const { METADATA, ITEM, PHOTO, PROJECT } = require('../constants')
const { bulk, load, remove, insert, update } = require('./util')
const { isArray } = Array

module.exports = {
  metadata(state = {}, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}

      case METADATA.LOAD:
        return load(state, payload, meta, error)

      case ITEM.REMOVE:
      case PHOTO.REMOVE:
        return remove(state, payload)

      case METADATA.INSERT:
        return insert(state, payload)

      case METADATA.UPDATE: {
        const [id, data] = payload

        return (isArray(id)) ?
          bulk.update(state, payload) : update(state, { ...data, id })
      }

      default:
        return state
    }
  }
}
