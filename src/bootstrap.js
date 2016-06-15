'use strict'

const START_TIME = Date.now()

{
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
}


const { verbose } = require('./common/log')(global.args.home)
const { remote } = require('electron')
const Window = require('./window')
const { Strings } = require('./common/res')
const { all } = require('bluebird')
const { once } = require('./common/util')
const { emit } = require('./dom')

all([
  Strings.open('en').then((strings) => {
    global.R = { strings }
  }),

  once(document, 'DOMContentLoaded')
])
  .then(() => {
    Window.setup()

    verbose('%s ready after %dms',
        Window.type, Date.now() - START_TIME)

    emit(document, 'tropy:ready')
  })


if (global.args.environment === 'development') {
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
