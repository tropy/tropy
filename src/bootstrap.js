'use strict'

try {
  const START = Date.now()

  const opts = require('./args').parse()
  const { Window } = require('./window')
  const { ready } = require('./dom')
  const { ipcRenderer: ipc } = require('electron')

  const win = new Window(opts)
  const { fatal, info } = require('./common/log')({
    dest: opts.log,
    level: opts.level,
    name: win.type
  })

  info({
    dpx: window.devicePixelRatio,
    opts
  }, `${win.type}.init`)

  ready
    .then(() => Date.now())
    .then((READY) =>
      win.init().then(() => {
        ipc.send('wm', 'initialized')
        const INIT = Date.now()
        require(`./views/${win.type}`)
        const LOAD = Date.now()

        requestIdleCallback(() => {
          ipc.send('wm', 'ready')
          win.toggle('ready')
          win.ready = Date.now()

          info('%s ready %dms [dom:%dms win:%dms req:%dms]',
            win.type,
            win.ready - START,
            READY - START,
            INIT - READY,
            LOAD - INIT)
        }, { timeout: 1000 })
      }))
    .catch((e) => {
      fatal({ stack: e.stack }, `${win.type}.init failed`)

      if (opts.dev)
        ipc.send('wm', 'show')
      else
        process.crash()
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
