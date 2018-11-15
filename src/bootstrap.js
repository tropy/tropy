'use strict'

try {
  const START = performance.now()

  const { home, dev } = require('./args').parse()
  const { join } = require('path')
  const LOGDIR = join(home, 'log')

  const { verbose, warn } = require('./common/log')(LOGDIR)
  const { ready } = require('./dom')

  const { win } = require('./window')
  verbose(`initializing ${win.type} window...`)

  ready
    .then(() => performance.now())
    .then(READY =>
      win.init(() => {
        requestIdleCallback(win.show, { timeout: 500 })

        let DONE = performance.now()

        verbose('%s ready after %dms (%dms)', win.type,
          (DONE - START).toFixed(3),
          (DONE - READY).toFixed(3))
      }))
    .catch(error => {
      warn(`failed initializing ${win.type}: ${error.message}`)
      warn(error.stack)

      if (!dev) {
        win.current.close()
      }
    })

  // eslint-disable-next-line
  global.eval = function () {
    throw new Error('use of eval() is prohibited')
  }

  if (!dev) {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
  }

} catch (error) {
  process.stderr.write(`Uncaught error in bootstrap: ${error.message}\n`)
}
