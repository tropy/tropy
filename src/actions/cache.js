import { CACHE } from '../constants/index.js'

export default {
  prune(payload, meta = {}) {
    return {
      type: CACHE.PRUNE,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  purge(payload, meta = {}) {
    return {
      type: CACHE.PURGE,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  }
}
