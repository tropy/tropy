import { FLASH } from '../constants'

export default {
  show(payload, meta = {}) {
    return {
      type: FLASH.SHOW,
      payload,
      meta
    }
  },

  hide(payload, meta = {}) {
    return {
      type: FLASH.HIDE,
      payload,
      meta: { ipc: true, ...meta }
    }
  }
}
