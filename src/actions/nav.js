import { createAction } from '@reduxjs/toolkit'
import { NAV, LIST } from '../constants/index.js'
import * as COLUMN from '../slices/columns/builtin.js'

export const update = createAction(NAV.UPDATE)

export const mode = {
  item () {
    return update({ mode: NAV.MODE.ITEM })
  },

  project () {
    return update({ mode: NAV.MODE.PROJECT })
  }
}

export default {
  restore (payload, meta) {
    return {
      type: NAV.RESTORE,
      payload,
      meta: { ...meta }
    }
  },

  update,

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
