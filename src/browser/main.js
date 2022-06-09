import { app, dialog, powerMonitor, session } from 'electron'
import { join, resolve } from 'path'
import { mkdirSync as mkdir } from 'fs'
import { readdir } from 'fs/promises'
import { pathToFileURL } from 'url'
import { darwin, win32, system } from '../common/os'
import { exe, qualified, version } from '../common/release'
import { parse, argToURL } from './args'
import { createLogger, info, warn } from '../common/log'
import { Tropy } from './tropy'
import { handleSquirrelEvent } from './squirrel'

const START = process.getCreationTime() || Date.now()
const { args, opts } = parse()

process.env.NODE_ENV = opts.env

process.on('uncaughtException', error => { handleError(error) })
process.on('unhandledRejection', reason => { handleError(reason) })

// Set app name and paths as soon as possible!
app.name = qualified.product

if (!opts.data) {
  opts.data = join(app.getPath('appData'), exe)
}
setPath('userData', join(opts.data, 'electron'))

if (!opts.cache) {
  opts.cache = join(app.getPath('cache'), exe)

  if (opts.cache === opts.data)
    opts.cache = join(opts.data, 'cache')
}
setPath('userCache', opts.cache)

if (!opts.logs) {
  opts.logs = (darwin) ? app.getPath('logs') : join(opts.data, 'log')
}
setPath('logs', opts.logs)

let handlingSquirrelEvent = false
if (win32 && process.argv.length > 1) {
  let type = process.argv[1]
  let promise = handleSquirrelEvent(type, opts)

  if (promise) {
    handlingSquirrelEvent = true
    promise
      .catch((e) => handleError(e))
      .then(() => app.quit())
  }
}

let isDuplicateInstance = false
if (!handlingSquirrelEvent) {
  if (!app.requestSingleInstanceLock()) {
    isDuplicateInstance = true
    app.quit()
  }
}


if (!handlingSquirrelEvent && !isDuplicateInstance) {
  if (process.defaultApp) {
    app.setAsDefaultProtocolClient(
      'tropy', process.execPath, [resolve(process.argv[1])]
    )
  } else {
    app.setAsDefaultProtocolClient('tropy')
  }

  if (opts.webgl) {
    app.commandLine.appendSwitch('ignore-gpu-blacklist')
  }

  if (opts.scale) {
    app.commandLine.appendSwitch('force-device-scale-factor', opts.scale)
  }

  app.on('ready', async () => {
    createLogger({
      dest: join(opts.logs, 'tropy.log'),
      name: 'main',
      rotate: true,
      debug: opts.debug,
      trace: opts.trace
    })

    info({ args, opts, version }, `main.init ${version} ${system}`)

    let tropy = new Tropy(opts)

    await tropy.start()
    tropy.ready = Date.now()

    app.on('second-instance', async (_, argv, cwd) => {
      info({ argv, cwd }, 'second-instance')

      await tropy.open(
         ...parse(argv.slice(1)).args.map(arg => argToURL(arg, cwd))
      )
    })

    app.on('quit', (_, code) => {
      tropy.stop()
      info({ quit: true, code }, `quit with exit code ${code}`)
    })

    await tropy.open(...args)

    powerMonitor.on('shutdown', (event) => {
      event.preventDefault()
      app.quit()
    })

    process.on('SIGINT', () => app.quit())

    if (opts.extensions) {
      info({ path: opts.extensions }, 'loading chromium extensions')

      let entries = await readdir(opts.extensions, { withFileTypes: true })

      for (let entry of entries) {
        if (entry.isDirectory()) {
          await session.defaultSession.loadExtension(
            join(opts.extensions, entry.name),
            { allowFileAccess: true })
        }
      }
    }

    info(`ready after ${tropy.ready - START}ms`)
  })

  app.on('web-contents-created', (_, contents) => {
    contents.on('new-window', (event, url) => {
      warn(`prevented loading ${url}`)
      event.preventDefault()
    })
  })

  if (darwin) {
    app.on('open-file', (event, path) => {
      if (Tropy.instance?.ready)
        Tropy.instance.openFile(path)
      else
        args.push(pathToFileURL(path))

      event.preventDefault()
    })

    app.on('open-url', (event, url) => {
      if (Tropy.instance?.ready)
        Tropy.instance.open(new URL(url))
      else
        args.push(new URL(url))

      event.preventDefault()
    })

    let quit = false

    app.on('before-quit', () => {
      quit = true
    })
    app.on('window-all-closed', () => {
      if (quit) app.quit()
    })
  }
}

function setPath(name, path) {
  mkdir(path, { recursive: true })
  app.setPath(name, path)
}

function handleError(error, isFatal = false) {
  if (isFatal || !Tropy.instance?.ready) {
    return dialog.showErrorBox('Unhandled Error', error?.stack)
  }

  try {
    Tropy.instance.handleUncaughtException(error)
  } catch (e) {
    handleError(e, true)
  }
}

