import { createSlice } from '@reduxjs/toolkit'
import { dismiss } from '../activities.js'
import { restore, show } from './actions.js'
import { isDone } from '../cmd.js'
import * as views from './view.js'
import * as COLUMN from '../columns/builtin.js'
import { LIST, TAG } from '../../constants/index.js'

const initialState = {
  view: views.project(),
  query: '',
  tags: [],
  sort: {} // Sort column stored per list!
}

const searchSlice = createSlice({
  name: 'nav/search',
  initialState,

  reducers: {
    search: {
      prepare: (payload, meta) => ({
        payload,
        meta: { history: true, search: true, ...meta }
      }),
      reducer (state, { payload }) {
        state.query = payload.query
      }
    },

    // Sorts the view shown: { column, asc }.
    sort: {
      prepare: (payload, meta) => ({
        payload,
        // Only position needs a search (list order from SQL);
        // the order saga follows other columns by itself.
        meta: {
          search: payload.column === COLUMN.POSITION.id,
          ...meta
        }
      }),
      reducer (state, { payload: { column, asc } }) {
        state.sort[views.sortKey(state.view)] = { column, asc }
      }
    }
  },

  // Bound to their place by nav (see getSelectors).
  selectors: {
    // The list shown, if any.
    selectList: (search) =>
      views.listOf(search.view),

    selectIsView: (search, name) =>
      search.view.name === name,

    // The sort of the view shown, or its default.
    selectSort: (search) => {
      let key = views.sortKey(search.view)
      return search.sort[key] ?? views.defaultSort(key)
    }
  },

  extraReducers: (builder) => {
    builder
      // The query and tags are not restored.
      .addCase(restore, (_, { payload }) => {
        let { view, sort } = payload?.search ?? {}

        return {
          ...initialState,
          view: views.restore(view),
          sort: (typeof sort === 'object' && sort !== null) ? sort : {}
        }
      })

      // Only the view, query and tags: the payload may come from main.
      // The filters stay unless given (a view change keeps them).
      .addCase(show, (state, { payload }) => {
        let { view = views.project(), query, tags } = payload

        state.view = view
        if (query !== undefined) state.query = query
        if (tags !== undefined) state.tags = tags
      })

      .addCase(LIST.REMOVE, (state, { payload }) => {
        if (views.isList(state.view, payload))
          state.view = views.project()
      })

      .addCase(LIST.COLLAPSE, (state, { payload, meta }) => {
        if (meta.select)
          state.view = views.list(payload)
      })

      .addCase(TAG.SELECT, (state, { payload, meta }) => {
        state.tags = selectTag(state.tags, payload, meta.mod)
      })

      .addCase(dismiss, (state, { payload }) => {
        if (views.isActivity(state.view, payload.type, payload.id))
          state.view = views.project()
      })

      .addMatcher(isDone(TAG.DELETE), (state, { payload }) => {
        if (state.tags.includes(payload))
          state.tags = state.tags.filter(id => id !== payload)
      })
  }
})

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

export default searchSlice
