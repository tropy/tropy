import { resolve } from 'node:path'
import process from 'node:process'

const root = resolve(import.meta.dirname, '../..')

if (process.type === 'browser') {
  import('#tropy/main/res.js').then(({ Resource }) => {
    Object.defineProperty(Resource, 'base', {
      get() { return root }
    })
  })
} else {
  import('#tropy/args.js').then((args) => {
    args.update({
      app: root,
      locale: 'en',
      env: process.env.NODE_ENV || 'test',
      debug: process.env.TROPY_DEBUG || process.env.DEBUG
    })
  })
}
