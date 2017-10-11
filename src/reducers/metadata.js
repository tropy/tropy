'use strict'

const { METADATA, ITEM, PHOTO, PROJECT, SELECTION } = require('../constants')
const { bulk, load, merge, remove, replace, insert, update } = require('./util')


module.exports = {
  // eslint-disable-next-line complexity
  metadata(state = {}, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPENED:
        return {}
      case METADATA.LOAD:
        return load(state, payload, meta, error)
      case METADATA.MERGE:
        return merge(state, payload, meta, error)
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

      case SELECTION.CREATE:
        return (error || !meta.done) ? state : {
          ...state,
          [payload.id]: { id: payload.id }
        }

      case ITEM.REMOVE:
      case PHOTO.REMOVE:
        return remove(state, payload)

      default:
        return state
    }
  }
}
