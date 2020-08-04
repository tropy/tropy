'use strict'

global.ARGS = Object.freeze({
  locale: 'en',
  env: process.env.NODE_ENV || 'test',
  debug: process.env.TROPY_DEBUG || process.env.DEBUG
})
