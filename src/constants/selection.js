'use strict'

module.exports = {
  CREATE: 'selection.create',
  DELETE: 'selection.delete',
  LOAD: 'selection.load',
  ORDER: 'selection.order',
  RESTORE: 'selection.restore',
  SAVE: 'selection.save',

  NOTE: {
    ADD: 'selection.note.add',
    REMOVE: 'selection.note.remove'
  },

  BULK: {
    UPDATE: 'selection.bulk.update'
  },

  TEMPLATE: {
    CHANGE: 'selection.template.change',
    DEFAULT: 'https://tropy.org/v1/templates/selection'
  },

  SUBJECT: {
    SAVE: 'photo.subject.save',
    DEFAULT: 'https://tropy.org/v1/tropy#Selection'
  }
}
