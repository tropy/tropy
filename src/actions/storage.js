import { STORAGE } from '../constants'

export default {
  reload(payload, meta = {}) {
    return { type: STORAGE.RELOAD, payload, meta }
  }
}
