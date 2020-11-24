import { app, dialog, powerMonitor } from 'electron'
import { extname, join, resolve } from 'path'
import { mkdirSync as mkdir } from 'fs'
import { darwin, win32, system } from '../common/os'
import { exe, qualified, version } from '../common/release'
import { parse } from './args'
import { createLogger, info, warn } from '../common/log'
import { Tropy } from './tropy'
import { handleSquirrelEvent } from './squirrel'

const START = getCreationTime() || Date.now()
const { args, opts } = parse()

process.env.NODE_ENV = opts.env

process.on('uncaughtException', error => { handleError(error) })
process.on('unhandledRejection', reason => { handleError(reason) })

app.allowRendererProcessReuse = false

// Set app name and paths as soon as possible!
// TODO single-release use unqualified!
app.name = qualified.product

// TODO win32
// app.setAppUserModelId()

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
  app.setAsDefaultProtocolClient('tropy')

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

    app.on('second-instance', (_, argv, pwd) => {
      info({ argv, pwd }, 'second-instance')
      tropy.open(
        ...parse(argv.slice(1)).args.map(f => resolve(pwd, f))
      )
    })

    app.on('quit', (_, code) => {
      tropy.stop()
      info({ quit: true, code }, `quit with exit code ${code}`)
    })

    tropy.open(...args.map(f => resolve(f)))

    powerMonitor.on('shutdown', (event) => {
      event.preventDefault()
      app.quit()
    })

    info(`ready after ${tropy.ready - START}ms`)
  })

  app.on('web-contents-created', (_, contents) => {
    contents.on('new-window', (event, url) => {
      warn(`prevented loading ${url}`)
      event.preventDefault()
    })
  })

  if (darwin) {
    app.on('open-file', (event, file) => {
      if (Tropy.instance?.ready) {
        if (Tropy.instance.open(file))
          event.preventDefault()
      } else {
        if (extname(file) === '.tpy') {
          args.push(file)
          event.preventDefault()
        }
      }
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

function getCreationTime() {
  for (let m of app.getAppMetrics()) {
    if (m.type === 'Browser') return m.creationTime
  }
}
