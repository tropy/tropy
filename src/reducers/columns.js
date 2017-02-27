'use strict'

const {
  COLUMNS, PROPERTIES: { DC }
} = require('../constants')

const init = [
  { width: '40%', property: DC.TITLE },
  { width: '25%', property: DC.CREATOR },
  { width: '20%', property: DC.DATE },
  { width: '15%', property: DC.TYPE }
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
