'use strict'

module.exports = {
  CONSOLIDATE: 'photo.consolidate',
  CONTRACT: 'photo.contract',
  CREATE: 'photo.create',
  DELETE: 'photo.delete',
  DUPLICATE: 'photo.duplicate',
  EXPAND: 'photo.expand',
  EXTRACT: 'photo.extract',
  INSERT: 'photo.insert',
  LOAD: 'photo.load',
  MOVE: 'photo.move',
  ORDER: 'photo.order',
  RESTORE: 'photo.restore',
  ROTATE: 'photo.rotate',
  SAVE: 'photo.save',
  SELECT: 'photo.select',
  UPDATE: 'photo.update',

  BULK: {
    UPDATE: 'photo.bulk.update'
  },

  NOTE: {
    ADD: 'photo.note.add',
    REMOVE: 'photo.note.remove'
  },

  SELECTION: {
    ADD: 'photo.selection.add',
    REMOVE: 'photo.selection.remove'
  },

  TEMPLATE: {
    CHANGE: 'photo.template.change',

    DEFAULT: 'https://tropy.org/v1/templates/photo'
  }
}
