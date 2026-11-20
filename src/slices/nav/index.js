import { createSlice } from '@reduxjs/toolkit'
import { create as createSelection, has, ids } from '../../common/selection.js'
import { array, merge, omit } from '../../common/util.js'
import { expands } from '../../common/search.js'
import { dismiss } from '../activities.js'
import * as views from './view.js'
import * as COLUMN from '../columns/builtin.js'

import {
  EDIT,
  NAV,
  ITEM,
  LIST,
  TAG,
  NOTE,
  PHOTO
} from '../../constants/index.js'

const reset = {
  item: createSelection(),
  photo: null,
  selection: null,
  note: null
}

const initialState = {
  ...reset,
  mode: NAV.MODE.PROJECT,
  view: views.project(),
  query: '',
  tags: [],
  sort: {}
}

// Sets the item, photo, selection and note shown.
const setShown = (state, { item, photo, selection, note }) => {
  state.item = item
  state.photo = photo
  state.selection = selection
  state.note = note
}

// Drops the selections when selected items are removed.
const removeItems = (state, { payload, meta }) => {
  if (!meta.done && array(payload).some(id => has(state.item, id)))
    Object.assign(state, reset)
}

const nav = createSlice({
  name: 'nav',
  initialState,

  reducers: {
    restore (_, { payload }) {
      let state = merge(initialState,
        omit(payload || {}, ['query', 'tags', 'view']))

      state.view = views.restore(payload?.view)
      state.item = createSelection(ids(state.item), state.item)

      return state
    },

    // Shows a view: { view, query, tags }.
    show: {
      prepare: (payload, meta) => ({
        payload,
        meta: { log: 'trace', history: true, search: true, ...meta }
      }),
      reducer (state, { payload }) {
        Object.assign(state, reset, {
          mode: NAV.MODE.PROJECT,
          view: views.project(),
          tags: []
        }, payload)
      }
    },

    // A new search clears the selections, unless it can only widen
    // the results (e.g. clearing the query or backspacing), so that
    // what is selected stays (see search in sagas/search.js).
    search: {
      prepare: (payload, meta) => ({
        payload,
        meta: { history: true, search: true, ...meta }
      }),
      reducer (state, { payload }) {
        if ('query' in payload && !expands(state.query, payload.query))
          Object.assign(state, reset)

        Object.assign(state, payload)
      }
    },

    sort: {
      prepare: (payload, meta) => ({
        payload: {
          ...payload,
          list: payload.list ?? LIST.ROOT
        },
        // Only position needs a search (list order from SQL);
        // the order saga follows other columns by itself.
        meta: { search: payload.column === COLUMN.POSITION.id, ...meta }
      }),
      reducer (state, { payload: { list, ...sort } }) {
        state.sort[list || LIST.ROOT] = sort
      }
    },

    // Leaves item mode.
    projectMode (state) {
      state.mode = NAV.MODE.PROJECT
    },

    // The search moved the photo and note cursors to matching ones
    // (see narrow in sagas/search.js): { photo, selection, note }.
    narrow (state, { payload: { photo, selection, note } }) {
      state.photo = photo
      state.selection = selection
      state.note = note
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(LIST.REMOVE, (state, { payload }) => {
        if (views.isList(state.view, payload))
          Object.assign(state, reset, { view: views.project() })
      })

      .addCase(LIST.COLLAPSE, (state, { payload, meta }) => {
        if (meta.select)
          Object.assign(state, reset, { view: views.list(payload) })
      })

      .addCase(LIST.ITEM.REMOVE, (state, { meta }) => {
        if (!meta.done)
          Object.assign(state, reset)
      })

      .addCase(ITEM.DELETE, removeItems)
      .addCase(ITEM.RESTORE, removeItems)
      .addCase(ITEM.REMOVE, removeItems)

      .addCase(ITEM.SELECT, (state, { payload }) => {
        setShown(state, payload)
      })

      .addCase(ITEM.OPEN, (state, { payload, meta, error }) => {
        if (!meta.done || error || payload == null) return

        state.mode = NAV.MODE.ITEM
        setShown(state, { ...payload, item: createSelection([payload.id]) })
      })

      .addCase(NOTE.OPEN, (state, { payload, meta, error }) => {
        if (!meta.done || error) return

        state.mode = NAV.MODE.ITEM
        setShown(state, { ...payload, item: createSelection([payload.item]) })
      })

      .addCase(EDIT.START, (state, { payload }) => {
        if (payload.tag || payload.list)
          state.mode = NAV.MODE.PROJECT
      })

      .addCase(TAG.DELETE, (state, { payload, meta, error }) => {
        if (meta.done && !error && state.tags.includes(payload))
          state.tags = state.tags.filter(id => id !== payload)
      })

      // Adding a tag to the filter (AND) may narrow the results:
      // it clears the selections; removing tags only widens them.
      .addCase(TAG.SELECT, (state, { payload, meta }) => {
        let tags = selectTag(state.tags, payload, meta.mod)
        let isTrash = state.view.name === 'trash'
        let isNarrowing = tags.some(id => !state.tags.includes(id)) || isTrash

        if (isNarrowing)
          Object.assign(state, reset)
        if (isTrash)
          state.view = views.project()

        state.tags = tags
      })

      .addCase(PHOTO.SELECT, (state, { payload }) => {
        if (payload) {
          setShown(state, { ...payload, item: createSelection([payload.item]) })
        } else {
          state.photo = null
          state.selection = null
        }
      })

      .addCase(NOTE.SELECT, (state, { payload }) => {
        if (payload)
          setShown(state, { ...payload, item: createSelection([payload.item]) })
        else
          state.note = null
      })

      .addCase(ITEM.PHOTO.REMOVE, (state, { payload }) => {
        if (has(state.item, payload.id) &&
          payload.photos.includes(state.photo)) {
          state.photo = null
          state.selection = null
          state.note = null
        }
      })

      .addCase(PHOTO.SELECTION.REMOVE, (state, { payload }) => {
        if (payload.id === state.photo &&
          payload.selections.includes(state.selection)) {
          state.selection = null
          state.note = null
        }
      })

      .addCase(dismiss, (state, { payload }) => {
        if (views.isActivity(state.view, payload.type, payload.id))
          Object.assign(state, reset, { view: views.project() })
      })
  }
})

export const {
  narrow,
  projectMode,
  restore,
  search,
  show,
  sort
} = nav.actions

export const mode = {
  project: projectMode
}

export default nav.reducer

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
