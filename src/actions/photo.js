import { PHOTO } from '../constants/index.js'
import { array } from '../common/util.js'

function update(payload, meta = {}) {
  return {
    type: PHOTO.UPDATE,
    payload,
    meta
  }
}

export default {
  consolidate(payload, meta) {
    return {
      type: PHOTO.CONSOLIDATE,
      payload: array(payload),
      meta: {
        cmd: 'project',
        cancel: true,
        ...meta
      }
    }
  },

  contract(payload, meta = {}) {
    return {
      type: PHOTO.CONTRACT, payload, meta
    }
  },

  create(payload, meta) {
    return {
      type: PHOTO.CREATE,
      payload,
      meta: {
        cancel: true,
        cmd: 'project',
        history: 'add',
        prompt: 'images',
        ...meta
      }
    }
  },

  delete(payload, meta) {
    return {
      type: PHOTO.DELETE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  duplicate(payload, meta) {
    return {
      type: PHOTO.DUPLICATE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  error(payload, meta = {}) {
    return (dispatch, getState) => {
      let id = payload
      let { selections } = getState()

      if (id in selections)
        id = selections[id].photo

      meta.consolidate = true

      return dispatch(update({ id, broken: true }, meta))
    }
  },

  expand(payload, meta = {}) {
    return {
      type: PHOTO.EXPAND, payload, meta
    }
  },

  extract(payload, meta) {
    return {
      type: PHOTO.EXTRACT,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  transcribe(payload, meta) {
    return {
      type: PHOTO.TRANSCRIBE,
      payload,
      meta: {
        cmd: 'project',
        ...meta,
        concurrency: 1
      }
    }
  },

  update,

  restore(payload, meta) {
    return {
      type: PHOTO.RESTORE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  rotate(payload, meta) {
    return {
      type: PHOTO.ROTATE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: PHOTO.SAVE,
      payload,
      meta: { cmd: 'project', history: 'merge', ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: PHOTO.LOAD,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  insert(payload, meta) {
    return {
      type: PHOTO.INSERT,
      payload,
      meta: { ...meta }
    }
  },

  select(payload, meta) {
    return (dispatch, getState) => {
      let { item, photo, selection, note } = payload

      if (note == null && photo != null) {
        note = (selection != null) ?
          getState().selections[selection].notes[0] :
          getState().photos[photo].notes[0]
      }

      dispatch({
        type: PHOTO.SELECT,
        payload: {
          photo,
          selection,
          note,
          item
        },
        meta: { log: 'trace', ...meta }
      })
    }
  },

  move(payload, meta) {
    return {
      type: PHOTO.MOVE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  order(payload, meta) {
    return {
      type: PHOTO.ORDER,
      payload,
      meta: { cmd: 'project', history: 'merge', ...meta }
    }
  },

  notes: {
    add(payload, meta) {
      return {
        type: PHOTO.NOTE.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: PHOTO.NOTE.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  selections: {
    add(payload, meta) {
      return {
        type: PHOTO.SELECTION.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: PHOTO.SELECTION.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  bulk: {
    update(payload, meta) {
      return {
        type: PHOTO.BULK.UPDATE,
        payload,
        meta: { ...meta }
      }
    }
  },

  template: {
    change({ id, template }, meta) {
      return {
        type: PHOTO.TEMPLATE.CHANGE,
        payload: {
          id: array(id),
          property: 'template',
          value: template
        },
        meta: {
          cmd: 'project',
          history: 'add',
          ...meta
        }
      }
    }
  }
}
