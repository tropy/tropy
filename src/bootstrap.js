'use strict'

try {
  const START = Date.now()

  const opts = require('./args').parse()
  const { join } = require('path')
  const LOGDIR = join(opts.home, 'log')

  const { info, error } = require('./common/log')(LOGDIR, opts)
  const { ready } = require('./dom')

  const { ipcRenderer: ipc } = require('electron')
  const { win } = require('./window')
  info(`initialize ${win.type} window...`)

  ready
    .then(() => Date.now())
    .then((READY) =>
      win.init().then(() => {
        const INIT = Date.now()
        ipc.send('wm', 'initialized')

        require(`./windows/${win.type}`)
        const REQUIRE = Date.now()

        requestIdleCallback(() => {
          ipc.send('wm', 'ready')
          win.toggle('ready')

          info('%s ready %dms [%dms %dms %dms]', win.type,
            (Date.now() - START),
            (READY - START),
            (INIT - READY),
            (REQUIRE - INIT))
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
