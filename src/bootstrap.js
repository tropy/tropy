'use strict'

try {
  const START = performance.now()

  const opts = require('./args').parse()
  const { join } = require('path')
  const LOGDIR = join(opts.home, 'log')

  const { verbose, warn } = require('./common/log')(LOGDIR, opts)
  const { ready } = require('./dom')

  const { win } = require('./window')
  verbose(`init ${win.type} window...`)

  ready
    .then(() => performance.now())
    .then((READY) =>
      win.init((INIT) => {
        require(`./windows/${win.type}`)
        const LOAD = performance.now()

        requestIdleCallback(() => {
          win.show()

          verbose('%s ready %dms [%dms %dms %dms]', win.type,
            (performance.now() - START).toFixed(3),
            (READY - START).toFixed(3),
            (INIT - READY).toFixed(3),
            (LOAD - INIT).toFixed(3))
        }, { timeout: 500 })
      }))

    .catch(error => {
      warn(`failed initializing ${win.type}: ${error.message}`)
      warn(error.stack)

      if (!opts.dev) {
        win.current.close()
      }
    })

  // eslint-disable-next-line
  global.eval = function () {
    throw new Error('use of eval() is prohibited')
  }

  if (!opts.dev) {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
  }

} catch (error) {
  process.stderr.write(`Uncaught error in bootstrap: ${error.message}\n`)
}
