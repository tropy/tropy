import { protocol } from 'electron'
import { capitalize } from '../common/util'

export function register(scheme, type, handler) {
  return new Promise((resolve, reject) => {
    protocol[`register${capitalize(type)}Protocol`](
      scheme,
      handler,
      err => (err != null) ? reject(err) : resolve())
  })
}

export function unregister(scheme) {
  return new Promise((resolve, reject) => {
    protocol.unregisterProtocol(
      scheme,
      err => (err != null) ? reject(err) : resolve())
  })
}
