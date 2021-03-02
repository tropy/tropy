import { spawn } from '../common/spawn'

export function defaults(method, domain, key) {
  return spawn('defaults', [method, domain, key].join(' '))
}

export async function read(domain, key, type = 'number') {
  let value = await defaults('read', domain, key)

  switch (type) {
    case 'number':
      return Number(value)
    default:
      return value
  }
}
