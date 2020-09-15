import { PROPERTIES } from '../constants'

export default {
  restore(payload, meta) {
    return {
      type: PROPERTIES.RESTORE,
      payload,
      meta: { ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: PROPERTIES.UPDATE,
      payload,
      meta: { ...meta }
    }
  }
}
