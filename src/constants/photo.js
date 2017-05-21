'use strict'

module.exports = {
  CREATE: 'photo.create',
  INSERT: 'photo.insert',
  LOAD: 'photo.load',
  SELECT: 'photo.select',
  DELETE: 'photo.delete',
  RESTORE: 'photo.restore',
  MOVE: 'photo.move',
  ORDER: 'photo.order',

  BULK: {
    UPDATE: 'photo.bulk.update'
  },

  NOTE: {
    ADD: 'photo.note.add',
    REMOVE: 'photo.note.remove'
  },

  TEMPLATE: 'https://tropy.org/schema/v1/templates/photo'
}
