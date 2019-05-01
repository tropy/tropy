'use strict'

try {
  const START = Date.now()

  const opts = require('./args').parse()
  const { user } = require('./path')
  const LOGDIR = user('log')

  const { info, fatal } = require('./common/log')(LOGDIR, opts)
  const { ready } = require('./dom')
  const { ipcRenderer: ipc } = require('electron')
  const { Window } = require('./window')

  const win = new Window(opts)
  info(`${win.type}.init...`)

  ready
    .then(() => Date.now())
    .then((READY) =>
      win.init().then(() => {
        ipc.send('wm', 'initialized')
        const INIT = Date.now()
        require(`./windows/${win.type}`)
        const LOAD = Date.now()

        requestIdleCallback(() => {
          ipc.send('wm', 'ready')
          win.toggle('ready')

          info('%s ready %dms [dom:%dms win:%dms req:%dms]', win.type,
            (Date.now() - START),
            (READY - START),
            (INIT - READY),
            (LOAD - INIT))
        }, { timeout: 1000 })
      }))
    .catch(({ message, stack }) => {
      fatal(`${win.type}.init failed: ${message}`, { stack })
      if (!opts.dev) process.crash()
    })

  // eslint-disable-next-line
  global.eval = () => {
    throw new Error('use of eval() is prohibited')
  }

  if (!opts.dev) {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
  }

} catch (e) {
  process.stderr.write(
    `Uncaught error in bootstrap: ${e.message}\n${e.stack}\n`)
  process.crash()
}
