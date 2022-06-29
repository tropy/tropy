import { basename } from 'node:path'
import ARGS from './args.js'
import { createLogger, fatal, info } from './common/log.js'
import { contextBridge, ipcRenderer as ipc } from 'electron'
import { idle, ready } from './dom.js'
import win, { createWindowInstance } from './window.js'

const START =
  performance?.timing?.navigationStart || Date.now()

;(async function bootstrap() {
  try {
    createLogger({
      dest: ARGS.log,
      level: ARGS.level,
      name: basename(location.pathname, '.html')
    })

    createWindowInstance(ARGS)

    info({
      dpx: devicePixelRatio,
      opts: ARGS
    }, `${win.type}.init`)

    try {
      await ready

      const READY = Date.now()

      await win.init()
      ipc.send('wm', 'init')
      win.toggle('init')

      const INIT = Date.now()
      const { store } = await import(`./views/${win.type}.js`)
      win.store = store

      const LOAD = Date.now()

      await idle()
      ipc.send('wm', 'ready')
      win.toggle('ready')
      win.ready = Date.now()

      info('%s ready %dms [dom:%dms win:%dms req:%dms]',
        win.type,
        win.ready - START,
        READY - START,
        INIT - READY,
        LOAD - INIT)

      let tropy = {
        state: () => store?.getState()
      }

      try {
        contextBridge.exposeInMainWorld('tropy', tropy)
      } catch {
        window.tropy = tropy
      }

    } catch (e) {
      fatal(`${win.type}.init crashed: ${e.message}`)
      ipc.send('error', e)
    }

    if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true }

    // eslint-disable-next-line
    window.eval = () => {
      throw new Error('use of eval() is prohibited')
    }

  } catch (e) {
    process.stderr.write(`Uncaught error in bootstrap\n${e.stack}\n`)
    process.crash()
  }
}())
