'use strict'

const { METADATA, ITEM, PHOTO, PROJECT } = require('../constants')
const { bulk, load, remove, replace, insert, update } = require('./util')


module.exports = {
  metadata(state = {}, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}
      case METADATA.LOAD:
        return load(state, payload, meta, error)
      case METADATA.REPLACE:
        return replace(state, payload)
      case METADATA.INSERT:
        return insert(state, payload)

      case METADATA.UPDATE: {
        const { ids, data } = payload

        return (ids.length === 1) ?
          update(state, { ...data, id: ids[0] }, meta) :
          bulk.update(state, [ids, data], meta)
      }

      case ITEM.REMOVE:
      case PHOTO.REMOVE:
        return remove(state, payload)

      default:
        return state
    }
  }
}
