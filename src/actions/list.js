import { LIST, EDIT } from '../constants'
import { array } from '../common/util'

export default {
  new(payload = {}, meta = {}) {
    return {
      type: EDIT.START,
      payload: {
        list: { name: '', ...payload, parent: payload.parent || LIST.ROOT }
      },
      meta
    }
  },

  insert(payload, meta = {}) {
    return { type: LIST.INSERT, payload, meta }
  },

  remove(payload, meta) {
    return {
      type: LIST.REMOVE,
      payload,
      meta: { search: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: ('id' in payload) ? LIST.SAVE : LIST.CREATE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: LIST.DELETE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  prune(payload, meta) {
    return { type: LIST.PRUNE, payload, meta: { cmd: 'project', ...meta } }
  },

  restore(payload, meta) {
    return { type: LIST.RESTORE, payload, meta: { cmd: 'project', ...meta } }
  },

  move(payload, meta) {
    return {
      type: LIST.MOVE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  load(payload, meta) {
    return { type: LIST.LOAD, payload, meta: { cmd: 'project', ...meta } }
  },

  update(payload, meta) {
    return { type: LIST.UPDATE, payload, meta }
  },

  collapse(payload, meta = {}) {
    return {
      type: LIST.COLLAPSE,
      payload,
      meta
    }
  },

  expand(payload, meta = {}) {
    return {
      type: LIST.EXPAND,
      payload,
      meta
    }
  },


  items: {
    add({ id, items }, meta) {
      return {
        type: LIST.ITEM.ADD,
        payload: { id, items: array(items) },
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    remove({ id, items }, meta) {
      return {
        type: LIST.ITEM.REMOVE,
        payload: { id, items: array(items) },
        meta: { cmd: 'project', history: 'add', search: true, ...meta }
      }
    },

    restore({ id, items }, meta) {
      return {
        type: LIST.ITEM.RESTORE,
        payload: { id, items: array(items) },
        meta: { cmd: 'project', search: true, ...meta }
      }
    }
  }
}
