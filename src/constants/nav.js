'use strict'

const TYPE = require('./type')

module.exports = {
  PERSIST: 'nav.persist',
  RESTORE: 'nav.restore',
  SEARCH: 'nav.search',
  SELECT: 'nav.select',
  SORT: 'nav.sort',
  UPDATE: 'nav.update',

  COLUMNS: {
    POSITION: {
      id: 'added',
      label: '',
      width: 48,
      type: TYPE.NUMBER
    }
  }
}
