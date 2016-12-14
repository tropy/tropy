'use strict'

const START = performance.now()

{
  const decode = decodeURIComponent
  const hash = window.location.hash.slice(1)

  global.ARGS = JSON.parse(decode(hash))
  process.env.NODE_ENV = ARGS.environment
}


const { verbose } = require('./common/log')(ARGS.home, ARGS)
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


if (ARGS.dev) {
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
