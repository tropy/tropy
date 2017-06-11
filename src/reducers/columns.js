'use strict'

const { COLUMNS, DC } = require('../constants')

const init = [
  { width: 40, property: DC.title },
  { width: 25, property: DC.creator },
  { width: 20, property: DC.date },
  { width: 15, property: DC.type }
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
