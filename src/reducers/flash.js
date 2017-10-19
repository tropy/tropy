
'use strict'

const { FLASH } = require('../constants')
const init = (ARGS.update.id) ? [ARGS.update] : [{
  id: 'update.ready',
  values: { version: '1.0.0' }
}]

module.exports = {
  flash(state = init, { type, payload }) {
    switch (type) {
      case FLASH.SHOW:
        return [payload, ...state]
      case FLASH.HIDE:
        return state.filter(f => f.id !== payload.id)
      default:
        return state
    }
  }
}
