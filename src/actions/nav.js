import { createAction } from '@reduxjs/toolkit'
import { NAV, LIST } from '../constants/index.js'
import * as COLUMN from '../slices/columns/builtin.js'

export const mode = {
  project: createAction('nav/mode/project')
}

// Narrow selection if search filters within item
export const narrow = createAction('nav/narrow')

export default {
  restore (payload, meta) {
    return {
      type: NAV.RESTORE,
      payload,
      meta: { ...meta }
    }
  },

  narrow,

  search (payload, meta) {
    return {
      type: NAV.SEARCH,
      payload,
      meta: { history: true, search: true, ...meta }
    }
  },

  // Shows a view: { view, query, tags }.
  show (payload, meta) {
    return {
      type: NAV.SELECT,
      payload,
      meta: { log: 'trace', history: true, search: true, ...meta }
    }
  },

  sort (payload, meta) {
    return {
      type: NAV.SORT,
      payload: {
        ...payload,
        list: payload.list ?? LIST.ROOT
      },
      // Only position needs a search (list order from SQL);
      // the order saga follows other columns by itself.
      meta: { search: payload.column === COLUMN.POSITION.id, ...meta }
    }
  },

  mode
}
