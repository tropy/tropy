import { PHOTO } from '../constants'
import { array } from '../common/util'

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
    return update(
      { id: payload, broken: true },
      { consolidate: true, ...meta })
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
    return {
      type: PHOTO.SELECT,
      payload,
      meta: { log: 'trace', ...meta }
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
