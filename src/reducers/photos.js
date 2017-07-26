'use strict'

const { METADATA, PHOTO, PROJECT } = require('../constants')
const { bulk, insert, load, nested, touch, update } = require('./util')

module.exports = {
  // eslint-disable-next-line complexity
  photos(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}

      case PHOTO.LOAD:
        return load(state, payload, meta, error)

      case PHOTO.CREATE:
        return (error || !meta.done) ?
          state :
          insert(state, payload)

      case PHOTO.INSERT:
        return insert(state, payload, meta)
      case PHOTO.UPDATE:
        return update(state, payload, meta)

      case PHOTO.NOTE.ADD:
        return nested.add('notes', state, payload, meta)
      case PHOTO.NOTE.REMOVE:
        return nested.remove('notes', state, payload, meta)

      case PHOTO.BULK.UPDATE:
        return bulk.update(state, payload, meta)

      case METADATA.SAVE:
      case METADATA.RESTORE:
        return touch(state, payload, meta, error)

      default:
        return state
    }
  }
}
