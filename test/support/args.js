'use strict'

if (process.type === 'renderer') {
  global.ARGS = Object.freeze({
    environment: 'test',
    debug: process.env.TROPY_DEBUG || process.env.DEBUG
  })
}
