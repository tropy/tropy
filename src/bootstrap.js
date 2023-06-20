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
      args: pick(ARGS, [
        'contrast',
        'fontSize',
        'frameless',
        'locale',
        'motion',
        'theme',
        'webgl',
        'zoom'
      ])
    }, `${win.type}.init`)

    try {
      await ready
      const READY = Date.now()

      await win.init()
      await win.load()

      await idle()

      info('%s ready %dms [dom:%dms init:%dms load:%dms]',
        win.type,
        Date.now() - START,
        READY - START,
        win.INIT - READY,
        win.LOAD - win.INIT)

      let tropy = {
        args: clone,
        state: () => win.store?.getState(),
        win: () => win
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
