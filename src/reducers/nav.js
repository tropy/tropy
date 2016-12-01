'use strict'

const { NAV, ITEM, LIST, TAG, PHOTO } = require('../constants')

const init = {
  items: [],
  tags: [],
  panel: { tab: 'metadata', photoZoom: 0 },
  itemsZoom: 0
}

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
  // eslint-disable-next-line complexity
  nav(state = init, { type, payload, meta }) {
    switch (type) {

      case NAV.RESTORE:
        return { ...init, ...payload }

      case NAV.UPDATE:
        return { ...state, ...payload }

      case LIST.REMOVE:
        return state.list === payload ?
          { ...state, list: null } :
          state

      case ITEM.DELETE:
      case ITEM.RESTORE:
      case ITEM.REMOVE:
        return !meta.done && isSelected(state.items, payload) ?
          { ...state, items: select(state.items) } :
          state

      case ITEM.SELECT:
        return {
          ...state,
          photo: null,
          items: select(state.items, payload, meta.mod)
        }

      case TAG.REMOVE:
        return isSelected(state.tags, payload) ?
          { ...state, tags: select(state.tags) } :
          state

      case TAG.SELECT:
        return {
          ...state,
          tags: select(state.tags, payload, meta.mod)
        }

      case PHOTO.SELECT:
        return { ...state, photo: payload }

      case ITEM.PHOTO.REMOVE:
        return isSelected(state.items, payload.id) &&
          payload.photos.includes(state.photo) ?
          { ...state, photo: null } : state


      case NAV.SELECT:
        return {
          ...state,
          items: select(state.items),
          ...payload
        }

      case NAV.PANEL.UPDATE:
        return {
          ...state, panel: { ...state.panel, ...payload }
        }

      default:
        return state
    }
  }
}
