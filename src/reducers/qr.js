import { QR } from '../constants/index.js'

const init = { items: [] }

export function qr(state = init, { type, payload }) {
  switch (type) {
    case QR.UPDATE:
      return { ...state, ...payload }
    default:
      return state
  }
}
