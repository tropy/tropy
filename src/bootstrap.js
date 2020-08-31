import { basename } from 'path'
import ARGS, { parse } from './args'
import { createLogger, fatal, info } from './common/log'
import { ipcRenderer as ipc } from 'electron'
import { ready } from './dom'
import win, { Window } from './window'

try {
  var START = Date.now()
  var READY
  var INIT
  var LOAD

  parse()

  createLogger({
    dest: ARGS.log,
    level: ARGS.level,
    name: basename(location.pathname, '.html')
  })

  new Window(ARGS)

  info({
    dpx: window.devicePixelRatio,
    opts: ARGS
  }, `${win.type}.init`)

  ready
    .then(() => READY = Date.now())
    .then(() => win.init())
    .then(() => {
      ipc.send('wm', 'init')
      win.toggle('init')
      INIT = Date.now()
      return import(`./views/${win.type}`)
    })
    .then(() => {
      LOAD = Date.now()

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
    })
    .catch((e) => {
      fatal({ stack: e.stack }, `${win.type}.init failed`)

      if (ARGS.dev)
        ipc.send('wm', 'show')
      else
        process.crash()
    })

  // eslint-disable-next-line
  global.eval = () => {
    throw new Error('use of eval() is prohibited')
  }

  if (!ARGS.dev) {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
  }

} catch (e) {
  process.stderr.write(
    `Uncaught error in bootstrap: ${e.message}\n${e.stack}\n`)
  process.crash()
}
