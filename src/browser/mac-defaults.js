import { execFile } from '../common/spawn'

export async function defaults(method, domain, key) {
  let { stdout } = await execFile('defaults', [method, domain, key], {
    encoding: 'utf-8'
  })

  return stdout.trim()
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
