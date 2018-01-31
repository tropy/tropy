'use strict'

const { COLUMNS, DC } = require('../constants')

const init = [
  { context: 'metadata', width: 40, property: DC.title },
  { context: 'metadata', width: 25, property: DC.creator },
  { context: 'metadata', width: 20, property: DC.date },
  { context: 'metadata', width: 15, property: DC.type }
]


module.exports = {
  columns(state = init, { type, payload }) {
    switch (type) {
      case COLUMNS.RESTORE:
        return [...(payload || init)]
      default:
        return state
    }
  }
}
