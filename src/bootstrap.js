'use strict'

const START_TIME = Date.now()

{
  const decode = decodeURIComponent
  const hash = window.location.hash.slice(1)

  if (process.env.NODE_ENV !== 'test') {
    global.ARGS = Object.freeze(JSON.parse(decode(hash)))

    process.env.NODE_ENV = ARGS.environment
    process.env.DEBUG = ARGS.debug

  } else {
    global.ARGS = {
      environment: 'test',
      debug: process.env.DEBUG
    }
  }
}


const { verbose } = require('./common/log')(ARGS.home)
const { remote } = require('electron')
const Window = require('./window')
const { ready } = require('./dom')

ready(() => {
  Window.setup()

  verbose('%s ready after %dms',
      Window.type, Date.now() - START_TIME)
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
