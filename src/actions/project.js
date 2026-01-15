import { PROJECT } from '../constants/index.js'


export default {
  opened(payload, meta) {
    return {
      type: PROJECT.OPENED,
      error: (payload instanceof Error),
      payload,
      meta: { ipc: true, ...meta }
    }
  },

  open(payload, meta) {
    return { type: PROJECT.OPEN, payload, meta }
  },

  closed(payload, meta) {
    return {
      type: PROJECT.CLOSED,
      payload,
      error: payload instanceof Error,
      meta: {
        ipc: true,
        ...meta
      }
    }
  },

  close(payload, meta) {
    return {
      type: PROJECT.CLOSE,
      payload,
      meta,
      error: payload instanceof Error
    }
  },

  optimize(payload = {}, meta = {}) {
    return {
      type: PROJECT.OPTIMIZE,
      payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  },

  prune(payload = {}, meta = {}) {
    return {
      type: PROJECT.PRUNE,
      payload,
      meta: {
        cmd: 'project',
        prompt: true,
        ...meta
      }
    }
  },

  reindex(payload = {}, meta = {}) {
    return {
      type: PROJECT.REINDEX,
      payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  },

  reload(payload = {}, meta = {}) {
    return {
      type: PROJECT.RELOAD,
      payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  },

  save(payload, meta = {}) {
    return {
      type: PROJECT.SAVE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  update(payload, meta = {}) {
    return {
      type: PROJECT.UPDATE,
      payload,
      meta: {
        ipc: payload.name != null || payload.isReadOnly != null,
        ...meta
      }
    }
  }
}
