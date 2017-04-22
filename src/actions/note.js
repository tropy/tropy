'use strict'

const { NOTE } = require('../constants')

module.exports = {
  create(payload, meta) {
    return {
      type: NOTE.CREATE,
      payload,
      meta: { async: true, history: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: NOTE.SAVE,
      payload,
      meta: { async: true, history: true, ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: NOTE.LOAD,
      payload,
      meta: { async: true, ...meta }
    }
  },

  select(payload, meta) {
    return (dispatch, getState) => {
      let { note, photo, item } = payload

      if (item == null) {
        const { photos } = getState()
        item = photos[photo].item
      }

      dispatch({
        type: NOTE.SELECT,
        payload: { note, photo, item },
        meta: { ...meta }
      })
    }
  },

  update(payload, meta) {
    return {
      type: NOTE.UPDATE,
      payload,
      meta: { ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: NOTE.DELETE,
      payload,
      meta: { async: true, history: true, ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: NOTE.RESTORE,
      payload,
      meta: { async: true, history: true, ...meta }
    }
  }
}
