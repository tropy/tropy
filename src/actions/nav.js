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

  select(payload, meta) {
    return {
      type: NAV.SELECT,
      payload,
      meta: { search: true, ...meta }
    }
  },

  sort(payload, meta) {
    return {
      type: NAV.SORT,
      payload,
      meta: { search: true, ...meta }
    }
  }
}
