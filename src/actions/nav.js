import { createAction } from '@reduxjs/toolkit'
import { NAV, LIST } from '../constants/index.js'

export const update = createAction(NAV.UPDATE)

export const mode = {
  item() {
    return update({ mode: NAV.MODE.ITEM })
  },

  project() {
    return update({ mode: NAV.MODE.PROJECT })
  }
}

export default {
  restore(payload, meta) {
    return {
      type: NAV.RESTORE,
      payload,
      meta: { ...meta }
    }
  },

  update,

  search(payload, meta) {
    return {
      type: NAV.SEARCH,
      payload,
      meta: { search: true, ...meta }
    }
  },

  select(payload, meta) {
    return {
      type: NAV.SELECT,
      payload,
      meta: { log: 'trace', search: true, ...meta }
    }
  },

  sort(payload, meta) {
    return {
      type: NAV.SORT,
      payload: {
        ...payload,
        list: payload.list ?? LIST.ROOT
      },
      meta: { search: true, ...meta }
    }
  },

  mode,

  column: {
    insert(payload, meta = {}) {
      return {
        type: NAV.COLUMN.INSERT,
        payload,
        meta
      }
    },

    order(payload, meta = {}) {
      return {
        type: NAV.COLUMN.ORDER,
        payload,
        meta
      }
    },

    remove(payload, meta = {}) {
      return {
        type: NAV.COLUMN.REMOVE,
        payload,
        meta
      }
    },

    resize(payload, meta = {}) {
      return {
        type: NAV.COLUMN.RESIZE,
        payload,
        meta
      }
    }
  }
}
