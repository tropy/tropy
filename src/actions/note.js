import { NOTE } from '../constants'
import { warn } from '../common/log'
import { get } from '../common/util'

function json(note) {
  return (note.state != null && typeof note.state.toJSON === 'function') ?
    { ...note, state: note.state.toJSON() } :
    note
}

export default {
  create(payload, meta) {
    return {
      type: NOTE.CREATE,
      payload: json(payload),
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  export(payload, meta = {}) {
    return {
      type: NOTE.EXPORT,
      payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  },

  insert(payload, meta = {}) {
    return {
      type: NOTE.INSERT,
      payload,
      meta
    }
  },

  save(payload, meta) {
    return {
      type: NOTE.SAVE,
      payload: json(payload),
      meta: {
        cmd: 'project',
        history: 'merge',
        changed: true,
        ...meta
      }
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
        let { photos, selections } = getState()

        if (photo == null) {
          photo = selections[selection]?.photo
        }

        item = photos[photo]?.item

        if (item == null) {
          return warn(`cannot select note #${note} without item!`)
        }
      }

      dispatch({
        type: NOTE.SELECT,
        payload: { note, photo, item, selection },
        meta: { log: 'trace', ...meta }
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
