import { CLASSES } from '../constants'

export default {
  restore(payload, meta) {
    return {
      type: CLASSES.RESTORE,
      payload,
      meta: { ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: CLASSES.UPDATE,
      payload,
      meta: { ...meta }
    }
  }
}
