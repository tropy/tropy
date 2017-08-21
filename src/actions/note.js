'use strict'

const { NOTE } = require('../constants')
const { warn } = require('../common/log')
const { get } = require('../common/util')

function json(note) {
  return (note.state != null && typeof note.state.toJSON === 'function') ?
    { ...note, state: note.state.toJSON() } :
    note
}

module.exports = {
  create(payload, meta) {
    return {
      type: NOTE.CREATE,
      payload: json(payload),
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: NOTE.SAVE,
      payload: json(payload),
      meta: { cmd: 'project', history: 'merge', ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: NOTE.LOAD,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  select(payload, meta) {
    return (dispatch, getState) => {
      let { note, photo, item, selection } = payload

      if (item == null) {
        const { photos } = getState()
        item = get(photos, [photo, 'item'])

        if (item == null) {
          return warn(`cannot select note #${note} without item`)
        }
      }

      dispatch({
        type: NOTE.SELECT,
        payload: { note, photo, item, selection },
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
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: NOTE.RESTORE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  }
}
