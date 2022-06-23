'use strict'

const { resolve } = require('node:path')
const process = require('node:process')

if (process.type === 'renderer') {
  let args = require('../../src/args.js')

  args.update({
    app: resolve(__dirname, '../..'),
    locale: 'en',
    env: process.env.NODE_ENV || 'test',
    debug: process.env.TROPY_DEBUG || process.env.DEBUG
  })

} else {
  let { Resource } = require('../../src/browser/res.js')

  Object.defineProperty(Resource, 'base', {
    get() { return resolve(__dirname, '../..') }
  })
}
