'use strict'

const TYPE = require('./type')

module.exports = {
  PERSIST: 'nav.persist',
  RESTORE: 'nav.restore',
  SEARCH: 'nav.search',
  SELECT: 'nav.select',
  SORT: 'nav.sort',
  UPDATE: 'nav.update',

  COLUMN: {
    INSERT: 'nav.column.insert',
    ORDER: 'nav.column.order',
    REMOVE: 'nav.column.remove',
    RESIZE: 'nav.column.resize',

    CREATED: {
      id: 'item.created',
      protected: true,
      type: TYPE.DATE
    },
    MODIFIED: {
      id: 'item.modified',
      protected: true,
      type: TYPE.DATE
    },
    POSITION: {
      id: 'added',
      label: '',
      protected: true,
      type: TYPE.NUMBER,
      width: 60
    }
  }
}
