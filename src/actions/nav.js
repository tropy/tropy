import { NAV } from '../constants'

export default {
  restore(payload, meta) {
    return {
      type: NAV.RESTORE,
      payload,
      meta: { ...meta }
    }
  },

  update(payload, meta) {
    return { type: NAV.UPDATE, payload, meta }
  },

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
      payload,
      meta: { search: true, ...meta }
    }
  },

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
