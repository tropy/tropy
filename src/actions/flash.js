import { FLASH } from '../constants/index.js'

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
