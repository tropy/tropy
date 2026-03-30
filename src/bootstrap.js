import { basename } from 'node:path'
import { clone, parse } from './args.js'
import { createLogger, fatal, info } from './common/log.js'
import { pick } from './common/util.js'
import { contextBridge, ipcRenderer as ipc } from 'electron'
import { idle, ready } from './dom.js'
import win, { createWindowInstance } from './window.js'

const START =
  performance?.timing?.navigationStart || Date.now()

const ARGS = parse()

window.ELECTRON_DISABLE_SECURITY_WARNINGS = !ARGS.debug

;(async function bootstrap () {
  try {
    createLogger({
      dest: ARGS.log,
      level: ARGS.level,
      name: basename(location.pathname, '.html')
    })

    createWindowInstance()

    info({
      dpx: devicePixelRatio,
      args: pick(ARGS, ['frameless', 'locale', 'rendererPreference', 'zoom'])
    }, `${win.type}.init`)

    try {
      await ready
      const READY = Date.now()

      await win.init()
      const INIT = Date.now()

      await win.load()
      const LOAD = Date.now()

      await idle()

      info('%s ready %dms [dom:%dms init:%dms load:%dms]',
        win.type,
        Date.now() - START,
        READY - START, INIT - READY, LOAD - INIT)


      try {
        // Expose tropy global / context-bridge for console-use.
        window.tropy = {
          args: clone,
          state: () => win.store?.getState(),
          win: () => win
        }

        contextBridge.exposeInMainWorld('tropy', window.tropy)
      } catch {
        // Ignore. Most likely we're not sandboxed.
      }

    } catch (err) {
      fatal(`${win.type}.init crashed: ${err.message}`)
      ipc.send('error', { message: err.message, stack: err.stack, code: err.code })
    }

    if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true }


    window.eval = () => {
      throw new Error('use of eval() is prohibited')
    }

  } catch (err) {
    process.stderr.write(`Uncaught error in bootstrap\n${err.stack}\n`)
    process.crash()
  }
}())
