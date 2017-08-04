'use strict'

module.exports = {
  CREATE: 'photo.create',
  DELETE: 'photo.delete',
  INSERT: 'photo.insert',
  LOAD: 'photo.load',
  MOVE: 'photo.move',
  ORDER: 'photo.order',
  RESTORE: 'photo.restore',
  SAVE: 'photo.save',
  SELECT: 'photo.select',

  BULK: {
    UPDATE: 'photo.bulk.update'
  },

  NOTE: {
    ADD: 'photo.note.add',
    REMOVE: 'photo.note.remove'
  },

  TEMPLATE: 'https://tropy.org/v1/templates/photo'
}
