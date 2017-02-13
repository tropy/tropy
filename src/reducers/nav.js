'use strict'

const {
  NAV, ITEM, LIST, TAG, PHOTO, PROJECT, PROPERTIES: { DC }
} = require('../constants')

const { isSelected } = require('../selection')

const init = {
  mode: 'project',
  items: [],
  tags: [],
  sort: { type: 'property', column: DC.TITLE, asc: true },
  panel: { tab: 'metadata', photoZoom: 0 },
  lists: {},
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

module.exports = {
  // eslint-disable-next-line complexity
  nav(state = init, { type, payload, meta }) {
    switch (type) {

      case NAV.RESTORE:
        return { ...init, ...payload }

      case NAV.UPDATE:
        return { ...state, ...payload }

      case NAV.SORT: {
        const { list, ...sort } = payload

        if (list) {
          return {
            ...state,
            lists: {
              ...state.lists,
              [list]: { ...state.lists[list], ...sort }
            }
          }

        } else {
          return {
            ...state,
            sort: { ...state.sort, ...sort }
          }
        }
      }

      case LIST.REMOVE:
        return state.list === payload ?
          { ...state, list: null, items: select(state.items), photo: null } :
          state

      case ITEM.DELETE:
      case ITEM.RESTORE:
      case ITEM.REMOVE:
        return !meta.done && isSelected(state.items, ...payload) ?
          { ...state, items: select(state.items), photo: null } :
          state

      case ITEM.SELECT:
        return {
          ...state,
          photo: null,
          note: null,
          items: select(state.items, payload, meta.mod)
        }

      case ITEM.OPEN: {
        const { id, photos } = payload
        const photo = photos ?
          (photos.includes(state.photo) ? state.photo : photos[0]) : null

        return {
          ...state,
          mode: PROJECT.MODE.ITEM,
          photo,
          items: select(state.items, id, 'replace')
        }
      }

      case TAG.REMOVE:
        return isSelected(state.tags, payload) ?
          { ...state, tags: select(state.tags) } :
          state

      case TAG.SELECT:
        return {
          ...state,
          photo: null,
          items: select(state.items),
          trash: null,
          tags: select(state.tags, payload, meta.mod)
        }

      case PHOTO.SELECT:
        return payload ? {
          ...state,
          photo: payload.photo,
          items: select(state.items, payload.item, 'replace')
        } : { ...state, photo: null }

      case ITEM.PHOTO.REMOVE:
        return isSelected(state.items, payload.id) &&
          payload.photos.includes(state.photo) ?
          { ...state, photo: null } : state


      case NAV.SELECT:
        return {
          ...state,
          items: select(state.items),
          tags: select(state.tags),
          trash: null,
          list: null,
          photo: null,
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
