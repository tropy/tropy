'use strict'

const { array } = require('../common/util')
const { METADATA } = require('../constants')

module.exports = {
  insert(payload, meta = {}) {
    return {
      type: METADATA.INSERT,
      payload,
      meta
    }
  },

  load(payload = {}, meta) {
    return {
      type: METADATA.LOAD,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  merge(payload, meta) {
    return {
      type: METADATA.MERGE,
      payload,
      meta
    }
  },

  replace(payload, meta) {
    return {
      type: METADATA.REPLACE,
      payload,
      meta
    }
  },

  restore(payload, meta) {
    return {
      type: METADATA.RESTORE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  save({ id, ids, data }, meta) {
    return {
      type: METADATA.SAVE,
      payload: { ids: array(ids || id), data },
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  update({ id, ids, data }, meta = {}) {
    return {
      type: METADATA.UPDATE,
      payload: { ids: array(ids || id), data },
      meta
    }
  }
}
