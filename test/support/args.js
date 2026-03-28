import { resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = resolve(import.meta.dirname, '../..')

if (process.type === 'browser') {
  let { Resource } = require('#tropy/main/res.js')

  Object.defineProperty(Resource, 'base', {
    get() { return root }
  })
} else {
  let { update } = require('#tropy/args.js')

  update({
    app: root,
    frameless: false,
    locale: 'en',
    env: process.env.NODE_ENV || 'test',
    debug: process.env.TROPY_DEBUG || process.env.DEBUG
  })
}
