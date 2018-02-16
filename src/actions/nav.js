'use strict'

const { NAV } = require('../constants')

module.exports = {
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
    order(payload, meta = {}) {
      return {
        type: NAV.COLUMN.ORDER,
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
