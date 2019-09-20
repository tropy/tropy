'use strict'

module.exports = {
  CREATE: 'item.create',
  DELETE: 'item.delete',
  DESTROY: 'item.destroy',
  EXPLODE: 'item.explode',
  EXPORT: 'item.export',
  INSERT: 'item.insert',
  IMPORT: 'item.import',
  IMPLODE: 'item.implode',
  LOAD: 'item.load',
  MERGE: 'item.merge',
  OPEN: 'item.open',
  ORDER: 'item.order',
  REMOVE: 'item.remove',
  RESTORE: 'item.restore',
  SELECT: 'item.select',
  SPLIT: 'item.split',
  UPDATE: 'item.update',
  PREVIEW: 'item.preview',
  PRINT: 'item.print',

  BULK: {
    UPDATE: 'item.bulk.update'
  },

  TAG: {
    CREATE: 'item.tag.create',
    DELETE: 'item.tag.delete',
    INSERT: 'item.tag.insert',
    REMOVE: 'item.tag.remove',
    CLEAR: 'item.tag.clear',
    TOGGLE: 'item.tag.toggle'
  },

  PHOTO: {
    ADD: 'item.photo.add',
    REMOVE: 'item.photo.remove'
  },

  LAYOUT: {
    STACKED: 'stacked',
    SIDE_BY_SIDE: 'side-by-side'
  },

  TEMPLATE: {
    CHANGE: 'item.template.change',
    DEFAULT: 'https://tropy.org/v1/templates/generic'
  }
}
