import { createSlice } from '@reduxjs/toolkit'
import { dismiss } from '../activities.js'
import { restored, viewShown } from './actions.js'
import { isDone } from '../cmd.js'
import { expands } from '../../common/search.js'
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
    queryChanged: {
      prepare: (payload, meta) => ({
        payload,
        meta: { history: true, search: true, ...meta }
      }),
      reducer (state, { payload }) {
        state.query = payload.query
      }
    },

    sortChanged: {
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

  selectors: {
    selectList: (search) =>
      views.listOf(search.view),

    selectIsView: (search, name) =>
      search.view.name === name,

    selectSort: (search) => {
      let key = views.sortKey(search.view)
      return search.sort[key] ?? views.defaultSort(key)
    }
  },

  extraReducers: (builder) => {
    builder
      // The query and tags are not restored.
      .addCase(restored, (_, { payload }) => {
        let { view, sort } = payload?.search ?? {}

        return {
          ...initialState,
          view: views.restore(view),
          sort: (typeof sort === 'object' && sort !== null) ? sort : {}
        }
      })

      // Only the view, query and tags: the payload may come from main.
      // The filters stay unless given (a view change keeps them).
      .addCase(viewShown, (state, { payload }) => {
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

// Whether a search change can only widen the results
// (shared with nav's cross-slice reducer).
export function widens (prev, next) {
  if (prev === next)
    return true

  // The new view must contain the old one.
  if (!views.contains(next.view, prev.view))
    return false

  // The new query must expand on the old one.
  if (prev.query !== next.query && !expands(prev.query, next.query))
    return false

  // No tag added to the filter (tags combine with AND).
  if (next.tags.some(id => !prev.tags.includes(id)))
    return false

  return true
}
