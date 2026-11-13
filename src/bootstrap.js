import { basename } from 'node:path'
import { parse } from './args.js'
import { createLogger, fatal, info } from './common/log.js'
import { measure, pick } from './common/util.js'
import { contextBridge, ipcRenderer as ipc } from 'electron'
import { idle, ready } from './dom.js'
import win, { createWindowInstance } from './window.js'

const PRELOAD = performance.now()
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
      let init = await measure('init', () => win.init())
      let load = await measure('load', () => win.load())
      await idle()

      let [nav] = performance.getEntriesByType('navigation')
      let [fcp] = performance.getEntriesByName('first-contentful-paint')

      info({
        nav: nav?.type,
        spawn: (nav?.type === 'navigate' && ARGS.created)
          ? round(performance.timeOrigin - ARGS.created)
          : undefined,
        preload: round(PRELOAD),
        dom: round(nav?.domContentLoadedEventEnd),
        init: round(init),
        load: round(load),
        fcp: round(fcp?.startTime),
        ms: round(performance.now())
      }, `${win.type} ready`)


      globalThis.tropy = {
        get args () { return ARGS },
        state: () => win.store?.getState(),
        win
      }

      if (ARGS.dev || ARGS.debug)
        contextBridge.exposeInMainWorld('tropy', {
          state: globalThis.tropy.state
        })

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

function round (ms) {
  return (ms == null) ? undefined : Math.round(ms)
}
