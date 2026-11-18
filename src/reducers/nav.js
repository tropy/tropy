import { create, has, ids } from '../common/selection.js'
import { array, merge, insert, omit, splice } from '../common/util.js'
import { dc } from '../ontology/ns.js'
import { expands } from '../common/search.js'
import { cancel, dismiss, keep } from '../slices/activities.js'

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

/*
 * The view (nav.view): what the item results are drawn from,
 * filtered by tags and query.
 *   { name: 'project' }               all items (the default)
 *   { name: 'list', id }              the items in a list
 *   { name: 'unlisted' }              the items in no list
 *   { name: 'trash' }                 the deleted items
 *   { name: 'activity', type, id }    the items of an activity:
 *                                     the completed run of a type
 *                                     (id null), or the live run id.
 */
const PROJECT = { name: 'project' }

// Activity views always have an id: null for the completed run.
const activity = ({ type, id = null }) =>
  ({ name: 'activity', type, id })

const init = {
  ...reset,
  mode: NAV.MODE.PROJECT,
  view: PROJECT,
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


// When the live run shown is done, shows its completed record,
// or the project if the run was not recorded (see completed.js).
// The done action searches (e.g. the transcription batch's).
function leaveRun (state, meta) {
  let { view } = state

  if (!meta?.done || view.name !== 'activity' ||
    view.id == null || view.id !== meta.rel)
    return state

  return {
    ...state,
    view: keep({ meta }) ? activity({ type: view.type }) : PROJECT
  }
}

export function nav (state = init, { type, payload, meta, error }) {
  state = leaveRun(state, meta)

  switch (type) {
    case NAV.RESTORE: {
      let { items, ...nav } = omit(payload || {}, [
        'query', 'tags', 'view', 'list', 'trash', 'activity', 'imports'
      ])
      let state = merge(init, nav)

      state.view = restoreView(payload || {})

      // Restore item selection from legacy `items` array or previous state
      state.item = items
        ? create(items)
        : create(ids(state.item), state.item)

      return state
    }
    case NAV.UPDATE:
      return { ...state, ...payload }

    // A new search clears the selections, unless it can only widen
    // the results (e.g. clearing the query or backspacing), so that
    // what is selected stays (see search in sagas/search.js).
    case NAV.SEARCH:
      return ('query' in payload && !expands(state.query, payload.query)) ?
        { ...state, ...reset, ...payload } :
        { ...state, ...payload }

    case NAV.SORT: {
      const { list, ...sort } = payload

      return {
        ...state,
        sort: {
          ...state.sort,
          [list || LIST.ROOT]: sort
        }
      }
    }

    case LIST.REMOVE: {
      return (state.view.name !== 'list' || state.view.id !== payload) ?
        state : {
          ...state,
          ...reset,
          view: PROJECT
        }
    }
    case LIST.COLLAPSE: {
      return !meta.select ? state : {
        ...state,
        ...reset,
        view: { name: 'list', id: payload }
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
      if (!meta.done || error || payload == null)
        return state

      let { id, photo, selection, note } = payload
      return {
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

    // Adding a tag to the filter (AND) may narrow the results:
    // it clears the selections; removing tags only widens them.
    case TAG.SELECT: {
      let tags = selectTag(state.tags, payload, meta.mod)
      let isTrash = state.view.name === 'trash'
      let isNarrowing = tags.some(id => !state.tags.includes(id)) || isTrash

      return {
        ...state,
        ...(isNarrowing ? reset : null),
        ...(isTrash ? { view: PROJECT } : null),
        tags
      }
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
        mode: NAV.MODE.PROJECT,
        tags: [],
        ...payload,
        view: (payload?.view?.name === 'activity') ?
          activity(payload.view) :
          (payload?.view ?? PROJECT)
      }

    case cancel.type:
      return (state.view.name !== 'activity' ||
        state.view.id !== payload.id) ? state : {
          ...state,
          ...reset,
          view: PROJECT
        }

    case dismiss.type:
      return (state.view.name !== 'activity' ||
        state.view.type !== payload ||
        state.view.id != null) ? state : {
          ...state,
          ...reset,
          view: PROJECT
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

// The view of persisted nav state, also of legacy state
// (list: -1 for unlisted, trash) without a view.
// Live runs do not outlive the window:
// a live activity becomes the completed run of its type.
function restoreView ({ view, list, trash }) {
  switch (view?.name) {
    case 'activity':
      return activity({ type: view.type })
    case 'list':
    case 'unlisted':
    case 'trash':
    case 'project':
      return view
  }

  if (trash) return { name: 'trash' }
  if (list === -1) return { name: 'unlisted' }
  if (list > 0) return { name: 'list', id: list }

  return PROJECT
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
