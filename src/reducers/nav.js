import { create, has, ids } from '../common/selection.js'
import { array, merge, insert, omit, splice } from '../common/util.js'
import { dc } from '../ontology/ns.js'

import {
  EDIT,
  NAV,
  ITEM,
  LIST,
  TAG,
  NOTE,
  PHOTO
} from '../constants/index.js'

const reset = {
  item: create(),
  photo: null,
  selection: null,
  note: null
}

const init = {
  ...reset,
  mode: NAV.MODE.PROJECT,
  query: '',
  tags: [],
  sort: {},
  columns: [
    { width: 250, id: dc.title },
    { width: 100, id: dc.creator },
    { width: 100, id: dc.date },
    { width: 100, id: dc.type },
    { width: 190, id: NAV.COLUMN.CREATED.id }
  ]
}


export function nav (state = init, { type, payload, meta, error }) {
  switch (type) {
    case NAV.RESTORE: {
      let { items, ...nav } = omit(payload || {}, ['query', 'tags'])
      let state = merge(init, nav)

      // Restore item selection from legacy `items` array or previous state
      state.item = items
        ? create(items)
        : create(ids(state.item), state.item)

      return state
    }
    case NAV.UPDATE:
      return { ...state, ...payload }

    case NAV.SEARCH:
      return {
        ...state,
        ...reset,
        ...payload
      }

    case NAV.SORT: {
      const { list, ...sort } = payload

      return {
        ...state,
        sort: {
          ...state.sort,
          [list || 0]: sort
        }
      }
    }

    case LIST.REMOVE: {
      return (state.list !== payload) ? state : {
        ...state,
        ...reset,
        list: null
      }
    }
    case LIST.COLLAPSE: {
      return !meta.select ? state : {
        ...state,
        ...reset,
        list: payload
      }
    }
    case LIST.ITEM.REMOVE: {
      return meta.done ? state : {
        ...state,
        ...reset
      }
    }

    case ITEM.DELETE:
    case ITEM.RESTORE:
    case ITEM.REMOVE:
      return meta.done || !array(payload).some(id => has(state.item, id)) ?
        state : {
          ...state,
          ...reset
        }

    case ITEM.SELECT:
      return {
        ...state,
        photo: payload.photo,
        selection: payload.selection,
        note: payload.note,
        item: payload.item
      }

    case ITEM.OPEN: {
      let { id, photo, selection, note } = payload
      return (!meta.done || error) ? state : {
        ...state,
        mode: NAV.MODE.ITEM,
        item: create([id]),
        photo,
        selection,
        note
      }
    }
    case NOTE.OPEN: {
      let { item, photo, selection, note } = payload
      return (!meta.done || error) ? state : {
        ...state,
        mode: NAV.MODE.ITEM,
        item: create([item]),
        photo,
        selection,
        note
      }
    }
    case EDIT.START:
      if (state.mode === NAV.MODE.PROJECT) return state
      if (!payload.tag && !payload.list) return state

      return {
        ...state,
        mode: NAV.MODE.PROJECT
      }

    case TAG.DELETE:
      return (!meta.done || error || !state.tags.includes(payload)) ?
        state : {
          ...state,
          tags: state.tags.filter(id => id !== payload)
        }

    case TAG.SELECT:
      return {
        ...state,
        ...reset,
        trash: null,
        imports: null,
        tags: selectTag(state.tags, payload, meta.mod)
      }

    case PHOTO.SELECT:
      return payload ? {
        ...state,
        photo: payload.photo,
        selection: payload.selection,
        note: payload.note,
        item: create([payload.item])
      } : { ...state, photo: null, selection: null }

    case NOTE.SELECT:
      return payload ? {
        ...state,
        item: create([payload.item]),
        photo: payload.photo,
        selection: payload.selection,
        note: payload.note
      } : { ...state, note: null }

    case ITEM.PHOTO.REMOVE:
      return has(state.item, payload.id) &&
        payload.photos.includes(state.photo) ?
          { ...state, photo: null, selection: null, note: null } : state

    case PHOTO.SELECTION.REMOVE: {
      let { id, selections } = payload

      if (id !== state.photo)
        return state
      if (!selections.includes(state.selection))
        return state
      else
        return {
          ...state,
          selection: null,
          note: null
        }
    }


    case NAV.SELECT:
      return {
        ...state,
        ...reset,
        list: null,
        trash: null,
        imports: null,
        tags: [],
        ...payload
      }

    case NAV.COLUMN.INSERT:
      return {
        ...state,
        columns: insert(state.columns, meta.idx, payload)
      }
    case NAV.COLUMN.REMOVE:
      return {
        ...state,
        columns: state.columns.filter(col => col.id !== payload.id)
      }
    case NAV.COLUMN.ORDER: {
      const { order } = payload

      return {
        ...state,
        columns: state.columns.reduce((cols, c) =>
          ((cols[order[c.id]] = c), cols), [])
      }
    }
    case NAV.COLUMN.RESIZE: {
      const { column, width } = payload

      return {
        ...state,
        columns: splice(state.columns, column, 1, {
          ...state.columns[column], width
        })
      }
    }

    default:
      return state
  }
}

// TODO remove when tag list uses new selections
// The tag filter: replace, add (merge), remove or clear.
function selectTag (tags, id, mod = 'replace') {
  switch (mod) {
    case 'replace':
      return [id]
    case 'merge':
      return [...tags.filter(t => t !== id), id]
    case 'remove':
      return tags.filter(t => t !== id)
    case 'clear':
      return []
    default:
      throw new Error(`unknown selection mode: "${mod}"`)
  }
}
