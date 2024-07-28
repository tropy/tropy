import { IMPORTS } from '../constants/index.js'

export default {
  restore(payload, meta) {
    return {
      type: IMPORTS.RESTORE,
      payload,
      meta
    }
  }
}
