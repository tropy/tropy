'use strict'

global.ARGS = Object.freeze({
  locale: 'en',
  environment: 'test',
  debug: process.env.TROPY_DEBUG || process.env.DEBUG
})
