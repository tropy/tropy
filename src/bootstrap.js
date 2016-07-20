'use strict'

const START = performance.now()

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

ready.then(() => {
  const READY = performance.now()
  const Window = require('./window')

  Window.setup()

  const DONE = performance.now()

  verbose('%s ready after %dms (%dms)',
      Window.type, (DONE - START).toFixed(3), (DONE - READY).toFixed(3))
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
