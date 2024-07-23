import { resolve } from 'node:path'
import process from 'node:process'

if (process.type === 'browser') {
  let { Resource } = await import('../../src/main/res.js')

  Object.defineProperty(Resource, 'base', {
    get() { return resolve(import.meta.dirname, '../..') }
  })
} else {
  let args = await import('../../src/args.js')

  args.update({
    app: resolve(import.meta.dirname, '../..'),
    locale: 'en',
    env: process.env.NODE_ENV || 'test',
    debug: process.env.TROPY_DEBUG || process.env.DEBUG
  })
}
