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
    ORDER: 'nav.column.order',
    RESIZE: 'nav.column.resize',
    POSITION: {
      id: 'added',
      label: '',
      width: 60,
      type: TYPE.NUMBER
    }
  }
}
