import { QR } from '../constants'

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
