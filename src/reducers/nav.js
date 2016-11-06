'use strict'

const { UPDATE, RESTORE } = require('../constants/nav')
const LIST = require('../constants/list')
const ITEM = require('../constants/item')

const init = { items: [] }

function select(selection, id, mod) {
  switch (mod) {
    case 'clear':
      return []
    case 'remove':
      return selection.filter(i => i !== id)
    case 'merge':
      return [...selection, id]
    default:
      return [id]
  }
}

module.exports = {
  nav(state = init, { type, payload, meta }) {
    switch (type) {

      case RESTORE:
        return { ...init, ...payload }

      case UPDATE:
        return { ...state, ...payload }

      case LIST.REMOVE:
        return state.list === payload ?
          { ...state, list: undefined } :
          state

      case ITEM.SELECT:
        return {
          ...state,
          items: select(state.items, payload, meta.mod)
        }

      default:
        return state
    }
  }
}
