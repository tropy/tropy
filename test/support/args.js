'use strict'

if (process.type === 'renderer') {
  global.ARGS = Object.freeze({
    environment: 'test',
    debug: process.env.DEBUG
  })
}
