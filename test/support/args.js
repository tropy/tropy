'use strict'

global.ARGS = Object.freeze({
  locale: 'en',
  env: 'test',
  debug: process.env.TROPY_DEBUG || process.env.DEBUG
})
