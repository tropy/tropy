'use strict'

const {
  NAV, ITEM, LIST, TAG, NOTE, PHOTO, PROJECT, DC
} = require('../constants')

const { isSelected, select } = require('../selection')

const init = {
  mode: PROJECT.MODE.PROJECT,
  items: [],
  query: '',
  tags: [],
  sort: { type: 'property', column: DC.title, asc: true },
  lists: {}
}

module.exports = {
  // eslint-disable-next-line complexity
  nav(state = init, { type, payload, meta, error }) {
    switch (type) {

      case NAV.RESTORE:
        return { ...init, ...payload }

      case NAV.UPDATE:
        return { ...state, ...payload }

      case NAV.SEARCH:
        return {
          ...state,
          items: [],
          photo: null,
          selection: null,
          note: null,
          ...payload
        }

      case NAV.SORT: {
        const { list, ...sort } = payload

        if (list) {
          return {
            ...state,
            lists: {
              ...state.lists, [list]: { ...sort }
            }
          }

        } else {
          return {
            ...state, sort: { ...sort }
          }
        }
      }

      case LIST.REMOVE:
        return state.list === payload ?
          { ...state, list: null, items: [], photo: null } :
          state

      case ITEM.DELETE:
      case ITEM.RESTORE:
      case ITEM.REMOVE:
        return meta.done || !isSelected(state.items, payload) ?
          state : {
            ...state,
            items: [],
            photo: null,
            selection: null,
            note: null
          }

      case ITEM.SELECT:
        return {
          ...state,
          photo: payload.photo,
          selection: payload.selection,
          note: payload.note,
          items: select(state.items, payload.items, meta.mod)
        }

      case ITEM.IMPORT:
        return (!meta.done || error || !payload.length) ? state : {
          ...state,
          photo: null,
          note: null,
          tags: [],
          items: [...payload]
        }

      case ITEM.OPEN: {
        const { id, photos, selection } = payload
        const photo = photos ?
          (photos.includes(state.photo) ? state.photo : photos[0]) : null

        return {
          ...state,
          mode: PROJECT.MODE.ITEM,
          photo,
          selection,
          items: select(state.items, [id], 'replace')
        }
      }

      case TAG.DELETE:
        return (!meta.done || error || !isSelected(state.tags, payload)) ?
          state : {
            ...state,
            tags: select(state.tags, [payload], 'remove')
          }

      case TAG.SELECT:
        return {
          ...state,
          photo: null,
          items: [],
          trash: null,
          imports: null,
          tags: select(state.tags, [payload], meta.mod)
        }

      case PHOTO.SELECT:
        return payload ? {
          ...state,
          photo: payload.photo,
          selection: payload.selection,
          note: payload.note,
          items: [payload.item]
        } : { ...state, photo: null, selection: null }

      case NOTE.SELECT:
        return payload ? {
          ...state,
          items: [payload.item],
          photo: payload.photo,
          selection: payload.selection,
          note: payload.note
        } : { ...state, note: null }

      case ITEM.PHOTO.REMOVE:
        return isSelected(state.items, payload.id) &&
          payload.photos.includes(state.photo) ?
          { ...state, photo: null } : state


      case NAV.SELECT:
        return {
          ...state,
          items: [],
          tags: [],
          trash: null,
          imports: null,
          list: null,
          photo: null,
          ...payload
        }

      default:
        return state
    }
  }
}
