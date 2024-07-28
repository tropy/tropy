import { QR } from '../constants/index.js'

export default {
  update(payload = {}, meta) {
    return {
      type: QR.UPDATE,
      payload,
      meta: {
        log: 'trace',
        ...meta
      }
    }
  }
}
