'use strict'

try {
  const START = performance.now()

  const opts = require('./args').parse()
  const { join } = require('path')
  const LOGDIR = join(opts.home, 'log')

  const { info, error } = require('./common/log')(LOGDIR, opts)
  const { ready, toggle } = require('./dom')

  const { ipcRenderer: ipc } = require('electron')
  const { win } = require('./window')
  info(`initialize ${win.type} window...`)

  ready
    .then(() => performance.now())
    .then((READY) =>
      win.init().then(() => {
        const INIT = performance.now()
        ipc.send('wm', 'initialized')

        require(`./windows/${win.type}`)
        const REQUIRE = performance.now()

        requestIdleCallback(() => {
          ipc.send('wm', 'ready')
          toggle(document.body, 'ready', true)

          info('%s ready %dms [%dms %dms %dms]', win.type,
            (performance.now() - START).toFixed(3),
            (READY - START).toFixed(3),
            (INIT - READY).toFixed(3),
            (REQUIRE - INIT).toFixed(3))
        }, { timeout: 1000 })
      }))
    .catch(e => {
      error(`Failed initializing ${win.type}: ${e.message}`)
      error(e.stack)
      process.crash()
    })

  // eslint-disable-next-line
  global.eval = function () {
    throw new Error('use of eval() is prohibited')
  }

  if (!opts.dev) {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
  }

} catch (e) {
  process.stderr.write(`Uncaught error in bootstrap: ${e.message}\n`)
  process.stderr.write(e.stack)
  process.crash()
}
