'use strict'

const START = Date.now()

{
  const freeze = Object.freeze
  const decode = decodeURIComponent
  const hash = window.location.hash.slice(1)

  global.ARGS = freeze(JSON.parse(decode(hash)))

  process.env.NODE_ENV = ARGS.environment
  if (ARGS.debug) process.env.DEBUG = true
}


const { verbose } = require('./common/log')(ARGS.home)
const { remote } = require('electron')
const { ready } = require('./dom')

ready(() => {
  const READY = Date.now()
  const Window = require('./window')

  Window.setup()

  const DONE = Date.now()

  verbose('%s ready after %dms (%dms)',
      Window.type, DONE - START, DONE - READY)
})


if (ARGS.environment === 'development') {
  if (process.platform !== 'linux') {
    const props = Object.defineProperties

    props(process, {
      stdout: { value: remote.process.stdout },
      stderr: { value: remote.process.stderr }
    })
  }

} else {
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
}
