'use strict'

try {
  const START = Date.now()

  const opts = require('./args').parse()
  const { Window } = require('./window')
  const { ready } = require('./dom')
  const { ipcRenderer: ipc } = require('electron')

  const win = new Window(opts)
  const log = require('./common/log')({
    dest: opts.log,
    name: win.type
  })

  log.instance.info({
    dpx: window.devicePixelRatio,
    opts
  }, `${win.type}.init`)

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

          log.instance.info('%s ready %dms [dom:%dms win:%dms req:%dms]',
            win.type,
            (Date.now() - START),
            (READY - START),
            (INIT - READY),
            (LOAD - INIT))
        }, { timeout: 1000 })
      }))
    .catch(({ message, stack }) => {
      log.instance.fatal({ stack }, `${win.type}.init failed: ${message}`)
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
