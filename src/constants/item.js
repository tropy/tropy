'use strict'

module.exports = {
  CREATE: 'item.create',
  DELETE: 'item.delete',
  DESTROY: 'item.destroy',
  INSERT: 'item.insert',
  IMPORT: 'item.import',
  LOAD: 'item.load',
  MERGE: 'item.merge',
  OPEN: 'item.open',
  REMOVE: 'item.remove',
  RESTORE: 'item.restore',
  SAVE: 'item.save',
  SELECT: 'item.select',
  SPLIT: 'item.split',
  UPDATE: 'item.update',
  PREVIEW: 'item.preview',

  BULK: {
    UPDATE: 'item.bulk.update'
  },

  TAG: {
    CREATE: 'item.tag.create',
    DELETE: 'item.tag.delete',
    INSERT: 'item.tag.insert',
    REMOVE: 'item.tag.remove',
    CLEAR: 'item.tag.clear',
    TOGGLE: 'item.tag.toggle',
  },

  PHOTO: {
    ADD: 'item.photo.add',
    REMOVE: 'item.photo.remove'
  }
}
