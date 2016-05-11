'use strict'

global.START_TIME = Date.now()
global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}

const decode = decodeURIComponent
const hash = window.location.hash.slice(1)

if (process.env.NODE_ENV !== 'test') {
  global.args = Object.freeze(JSON.parse(decode(hash)))

  process.env.NODE_ENV = global.args.environment
  process.env.DEBUG = global.args.debug

} else {
  global.args = {
    environment: 'test',
    debug: process.env.DEBUG
  }
}

if (global.args.environment === 'development') {
  if (process.platform !== 'linux') {
    const props = Object.defineProperties
    const { remote } = require('electron')

    props(process, {
      stdout: { value: remote.process.stdout },
      stderr: { value: remote.process.stderr }
    })
  }

  try {
    require('devtron').install()
  } catch (_) {
    // ignore
  }
}

require('./common/log')(global.args.home)
