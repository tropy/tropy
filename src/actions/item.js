'use strict'

const { ITEM } = require('../constants')
const { array, get } = require('../common/util')

module.exports = {
  create(payload, meta) {
    return {
      type: ITEM.CREATE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  import(payload = {}, meta) {
    return {
      type: ITEM.IMPORT,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        search: true,
        prompt: true,
        ...meta
      }
    }
  },

  delete(payload, meta) {
    return {
      type: ITEM.DELETE,
      payload: array(payload),
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  destroy(payload, meta) {
    return {
      type: ITEM.DESTROY,
      payload: array(payload),
      meta: { cmd: 'project', prompt: true, ...meta }
    }
  },

  merge(payload, meta) {
    return {
      type: ITEM.MERGE,
      payload: array(payload),
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  split(payload, meta) {
    return {
      type: ITEM.SPLIT,
      payload,
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  explode(payload, meta) {
    return {
      type: ITEM.EXPLODE,
      payload: payload,
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  export(payload, meta) {
    return {
      type: ITEM.EXPORT,
      payload: array(payload),
      meta: { cmd: 'project', ...meta }
    }
  },

  implode(payload, meta) {
    return {
      type: ITEM.IMPLODE,
      payload,
      meta: { cmd: 'project', history: 'add', search: true, ...meta }
    }
  },

  insert(payload, meta) {
    return {
      type: ITEM.INSERT,
      payload,
      meta: { search: true, ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: ITEM.LOAD,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  remove(payload, meta) {
    return {
      type: ITEM.REMOVE,
      payload,
      meta: { search: true, ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: ITEM.RESTORE,
      payload: array(payload),
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: ITEM.UPDATE,
      payload,
      meta: meta
    }
  },

  select(payload, meta = {}) {
    return (dispatch, getState) => {
      let { items, photo, note } = payload
      let mod = meta.mod || 'replace'

      if (mod === 'all') {
        const { qr } = getState()
        mod = 'replace'
        items = qr.items

      } else if (items.length === 1 && mod === 'replace') {
        const state = getState()

        if (photo === undefined) {
          photo = get(state.items[items[0]], ['photos', 0])
        }

        if (note === undefined && photo) {
          note = get(state.photos[photo], ['notes', 0])
        }
      }


      dispatch({
        type: ITEM.SELECT,
        payload: { items, photo, note },
        meta: { log: 'trace', ...meta, mod }
      })
    }
  },

  open(payload, meta) {
    return {
      type: ITEM.OPEN,
      payload,
      meta: { ...meta }
    }
  },

  order(payload, meta) {
    return {
      type: ITEM.ORDER,
      payload,
      meta: { ...meta }
    }
  },

  preview(payload, meta) {
    return {
      type: ITEM.PREVIEW,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  print(payload, meta) {
    return {
      type: ITEM.PRINT,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  bulk: {
    update(payload, meta) {
      return {
        type: ITEM.BULK.UPDATE,
        payload,
        meta: meta
      }
    }
  },

  tags: {
    toggle(payload, meta = {}) {
      return {
        type: ITEM.TAG.TOGGLE,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    clear(payload, meta = {}) {
      return {
        type: ITEM.TAG.CLEAR,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    create(payload, meta) {
      return {
        type: ITEM.TAG.CREATE,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    insert(payload, meta) {
      return {
        type: ITEM.TAG.INSERT,
        payload,
        meta: { ...meta }
      }
    },

    delete(payload, meta) {
      return {
        type: ITEM.TAG.DELETE,
        payload,
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: ITEM.TAG.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  photos: {
    add(payload, meta) {
      return {
        type: ITEM.PHOTO.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: ITEM.PHOTO.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  template: {
    change({ id, template }, meta) {
      return {
        type: ITEM.TEMPLATE.CHANGE,
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
