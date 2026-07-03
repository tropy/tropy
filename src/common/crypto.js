import { createHash } from 'node:crypto'

export function md5 (data, encoding = 'hex') {
  let hash = createHash('md5')
  hash.update(data)
  return hash.digest(encoding)
}
