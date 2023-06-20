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

;(async function bootstrap() {
  try {
    createLogger({
      dest: ARGS.log,
      level: ARGS.level,
      name: basename(location.pathname, '.html')
    })

    createWindowInstance()

    info({
      dpx: devicePixelRatio,
      args: pick(ARGS, ['frameless', 'locale', 'webgl', 'zoom'])
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
