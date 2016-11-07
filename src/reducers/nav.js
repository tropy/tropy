'use strict'

const { UPDATE, RESTORE, SELECT } = require('../constants/nav')
const LIST = require('../constants/list')
const ITEM = require('../constants/item')

const init = { items: [] }

function select(selection, id, mod) {
  switch (mod) {
    case 'replace':
      return [id]
    case 'remove':
      return selection.filter(i => i !== id)
    case 'merge':
      return [...selection, id]
    default:
      return []
  }
}

function isSelected(selection, id) {
  return selection.includes(id)
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
          { ...state, list: null } :
          state

      case ITEM.REMOVE:
        return isSelected(state.items, payload) ?
          { ...state, items: select(state.items) } :
          state

      case ITEM.SELECT:
        return {
          ...state,
          items: select(state.items, payload, meta.mod)
        }

      case SELECT:
        return {
          ...state,
          items: select(state.items),
          ...payload
        }

      default:
        return state
    }
  }
}
