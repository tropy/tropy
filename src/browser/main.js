
import electron, { app } from 'electron'
import { extname, join, resolve } from 'path'
import { mkdirSync as mkdir } from 'fs'
import { darwin, win32, system } from '../common/os'
import { exe, qualified, version } from '../common/release'
import { parse } from './args'
import log from '../common/log'
import { Tropy } from './tropy'

const START = Date.now()
const { args, opts } = parse()

process.env.NODE_ENV = opts.env

// app.allowRendererProcessReuse = false

// Set app name and paths as soon as possible!
app.name = qualified.product

if (!opts.data) {
  opts.data = join(app.getPath('appData'), exe)
}
let userData = join(opts.data, 'electron')
mkdir(userData, { recursive: true })
app.setPath('userData', userData)

if (!opts.cache) {
  opts.cache = join(app.getPath('cache'), exe)

  if (opts.cache === opts.data)
    opts.cache = join(opts.data, 'cache')
}
mkdir(opts.cache, { recursive: true })
app.setPath('userCache', opts.cache)

if (!opts.logs) {
  opts.logs = (darwin) ?
    app.getPath('logs') :
    join(opts.data, 'log')
}

mkdir(opts.logs, { recursive: true })
app.setPath('logs', opts.logs)

if (!app.requestSingleInstanceLock()) {
  process.stderr.write('other instance detected, exiting...\n')
  app.exit(0)
}

if (app.isPackaged) {
  app.setAsDefaultProtocolClient('tropy')
}

export default (async function main() {
  if (win32 && (await import('./squirrel'))(opts))
    return

  const { info, warn } = log({
    dest: join(opts.logs, 'tropy.log'),
    name: 'main',
    rotate: true,
    debug: opts.debug,
    trace: opts.trace
  })

  if (opts.webgl) {
    app.commandLine.appendSwitch('ignore-gpu-blacklist')
  }

  if (opts.scale) {
    app.commandLine.appendSwitch('force-device-scale-factor', opts.scale)
  }

  info({
    opts,
    version
  }, `main.init ${version} ${system}`)

  const tropy = new Tropy(opts)
  const startups = [
    app.whenReady(),
    tropy.start()
  ]

  if (darwin) {
    app.on('open-file', (event, file) => {
      if (tropy.ready) {
        if (tropy.open(file))
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

  app.on('second-instance', (_, argv) => {
    if (tropy.ready)
      tropy.open(...parse(argv.slice(1)).args)
  })

  app.on('web-contents-created', (_, contents) => {
    contents.on('new-window', (event, url) => {
      warn(`prevented loading ${url}`)
      event.preventDefault()
    })
  })

  app.on('quit', (_, code) => {
    if (tropy.ready) tropy.stop()
    info({ quit: true, code }, `quit with exit code ${code}`)
  })

  const handleError = (error, isFatal = false) => {
    if (isFatal || !tropy.ready) {
      electron
        .dialog
        .showErrorBox('Unhandled Error', error.stack)
      app.exit(42)
    }

    try {
      tropy.handleUncaughtException(error)
    } catch (_) {
      handleError(_, true)
    }
  }

  process.on('uncaughtException', handleError)
  process.on('unhandledRejection', (reason) => handleError(reason))

  await Promise.all(startups)

  tropy.ready = Date.now()
  tropy.open(...args.map(f => resolve(f)))

  electron.powerMonitor.on('shutdown', (event) => {
    event.preventDefault()
    app.quit()
  })

  info(`ready after ${tropy.ready - START}ms`)
}())
