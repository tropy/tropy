import { IMPORTS } from '../constants'

export default {
  restore(payload, meta) {
    return {
      type: IMPORTS.RESTORE,
      payload,
      meta
    }
  }
}
