'use strict'

const START = performance.now()

const { home, dev } = require('./args').parse()
const { join } = require('path')
const LOGDIR = join(home, 'log')

const { verbose } = require('./common/log')(LOGDIR)
const { ready } = require('./dom')

ready.then(() => {
  const READY = performance.now()
  const { win } = require('./window')

  win.init(() => {
    win.show()
    requestIdleCallback(win.show, { timeout: 500 })

    const DONE = performance.now()

    verbose('%s ready after %dms (%dms)', win.type,
      (DONE - START).toFixed(3),
      (DONE - READY).toFixed(3))
  })
})

// eslint-disable-next-line
global.eval = function () {
  throw new Error('use of eval() is prohibited')
}

if (!dev) {
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
}
