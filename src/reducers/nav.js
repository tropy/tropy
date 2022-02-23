import assert from 'assert'
import { isSelected, select } from '../selection'
import { array, merge, insert, omit, splice } from '../common/util'
import { dc } from '../ontology'

import {
  EDIT,
  NAV,
  ITEM,
  LIST,
  TAG,
  NOTE,
  PHOTO,
  PROJECT
} from '../constants'

const { MODE } = PROJECT

const reset = {
  items: [],
  selection: null,
  note: null
}

const init = {
  ...reset,
  mode: MODE.PROJECT,
  query: '',
  photos: {},
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

// eslint-disable-next-line complexity
export function nav(state = init, { type, payload, meta, error }) {
  switch (type) {
    case NAV.RESTORE:
      return merge(init, omit(payload || {}, ['query', 'tags', 'photo']))
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
      return meta.done || !isSelected(state.items, payload) ?
        state : {
          ...state,
          ...reset
        }

    case ITEM.SELECT:
      return {
        ...state,
        selection: payload.selection,
        note: payload.note,
        items: select(state.items, payload.items, meta.mod),
        photos: {
          ...state.photos,
          // Restore photo selection
          [payload.items[0]]: array(payload.photo)
        }
      }

    case ITEM.OPEN: {
      let { id } = payload

      return {
        ...state,
        mode: MODE.ITEM,
        items: select(state.items, [id], 'replace'),
        selection: null
      }
    }

    case EDIT.START:
      if (state.mode === MODE.PROJECT) return state
      if (!payload.tag && !payload.list) return state

      return {
        ...state,
        mode: MODE.PROJECT
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
        ...reset,
        trash: null,
        imports: null,
        tags: select(state.tags, [payload], meta.mod)
      }

    case PHOTO.SELECT: {
      // TODO do we need this?
      if (payload == null)
        return {
          ...state,
          photos: {
            ...state.photos,
            [state.items[0]]: []
          },
          selection: null
        }

      // TODO deal with multiple photos (associate to respective items!)
      let { item, photo, selection, note } = payload

      assert(state.items.includes(item),
        "photo's item must be in active selection range!")

      return {
        ...state,
        photos: {
          ...state.photos,
          [item]: array(photo)
        },
        selection,
        note
      }
    }

    case NOTE.SELECT: {
      // TODO do we need this?
      if (payload == null)
        return { ...state, note: null }

      let { item, photo, selection, note } = payload

      assert(state.items.includes(item),
        "note's item must be in active selection range!")

      let photos = state.photos[item]?.includes(photo) ?
        state.photos :
        { ...state.photos, [item]: array(photo) }

      return {
        ...state,
        photos,
        selection,
        note
      }
    }

    case ITEM.PHOTO.REMOVE: {
      let { id, photos } = payload

      if (!isSelected(state.items, id))
        return state
      if (!isSelected(state.photos[id], photos))
        return state

      return {
        ...state,
        photos: {
          ...state.photos,
          [id]: []
        },
        selection: null,
        note: null
      }
    }

    case PHOTO.SELECTION.REMOVE: {
      let { selections } = payload

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
