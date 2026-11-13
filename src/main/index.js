import { app, dialog, powerMonitor } from 'electron'
import { join, resolve } from 'node:path'
import { mkdirSync as mkdir } from 'node:fs'
import { enableCompileCache } from 'node:module'
import { pathToFileURL } from 'node:url'
import { darwin, linux, win32, system } from '../common/os.js'
import { exe, qualified, version } from '../common/release.js'
import { parse } from './args.js'
import { createLogger, info, warn } from '../common/log.js'
import { measure } from '../common/util.js'
import { Tropy } from './tropy.js'
import { handleSquirrelEvent } from './squirrel.js'

enableCompileCache()

const MAIN = performance.now()
const { args, opts } = parse()

process.on('uncaughtException', err => { handleError(err) })
process.on('unhandledRejection', err => { handleError(err) })

// Set app name and paths as soon as possible!
app.setName(qualified.product)
app.userAgentFallback = qualified.name

if (!opts.data) {
  opts.data = join(app.getPath('appData'), exe)
}
setPath('userData', join(opts.data, 'electron'))

if (!opts.cache) {
  try {
    opts.cache = join(app.getPath('cache'), exe)

    if (opts.cache === opts.data)
      opts.cache = join(opts.data, 'cache')
  } catch {
    opts.cache = join(opts.data, 'cache')
  }
}
setPath('userCache', opts.cache)

if (!opts.logs) {
  try {
    opts.logs = (darwin) ? app.getPath('logs') : join(opts.data, 'log')
  } catch {
    opts.logs = join(opts.data, 'log')
  }
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
  if (!app.requestSingleInstanceLock({
    args: args.map(String),
    quit: opts.quit
  })) {
    isDuplicateInstance = true
    app.quit()
  } else {
    if (opts.quit) app.quit()
  }
}


if (!handlingSquirrelEvent && !isDuplicateInstance && !opts.quit) {
  // Subtle: adding '--' so that crafted links cannot add switches!
  if (process.defaultApp) {
    app.setAsDefaultProtocolClient(
      'tropy', process.execPath, [resolve(process.argv[1]), '--']
    )
  } else {
    app.setAsDefaultProtocolClient('tropy', process.execPath, ['--'])
  }

  if (opts.disableHardwareAcceleration)
    app.disableHardwareAcceleration()

  app.commandLine.appendSwitch('ignore-gpu-blacklist')

  if (linux) {
    app.commandLine.appendSwitch('enable-gpu-rasterization')
    app.commandLine.appendSwitch('enable-zero-copy')
  }

  if (opts.scale) {
    app.commandLine.appendSwitch('force-device-scale-factor', opts.scale)
  }

  app.on('ready', async () => {
    const APP = performance.now()

    createLogger({
      dest: join(opts.logs, 'tropy.log'),
      name: 'main',
      rotate: true,
      debug: opts.debug,
      trace: opts.trace
    })

    info({
      args,
      opts,
      platform: process.platform,
      arch: process.arch,
      version
    }, 'main.init')

    let tropy = new Tropy(opts)

    let start = await measure('start', () => tropy.start())
    tropy.ready = Date.now()

    app.on('second-instance', async (_, argv, cwd, { args, quit }) => {
      info({ args, quit }, 'second-instance')

      if (quit)
        app.quit()
      else
        await tropy.open(...args.map(url => new URL(url)))
    })

    app.once('gpu-info-update', () => {
      info({ gpu: app.getGPUFeatureStatus() }, 'gpu-info-update')
    })

    app.on('quit', async (_, code) => {
      await tropy.stop()
      info({ quit: true, code }, `quit with exit code ${code}`)
    })

    let open = await measure('open', () => tropy.open(...args))

    powerMonitor.on('shutdown', (event) => {
      event.preventDefault()
      app.quit()
    })

    process.on('SIGINT', () => app.quit())

    info({
      node: Math.round(performance.nodeTiming.bootstrapComplete),
      main: Math.round(MAIN),
      app: Math.round(APP),
      start: Math.round(start),
      open: Math.round(open),
      ms: Math.round(performance.now())
    }, 'ready')
  })

  app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler((details) => {
      warn({ url: details.url }, 'prevented opening window')
      return { action: 'deny' }
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
  }

  let quit = false

  app.on('before-quit', () => {
    quit = true
  })
  app.on('window-all-closed', () => {
    if (quit || !darwin) app.quit()
  })
}

function setPath (name, path) {
  mkdir(path, { recursive: true })
  app.setPath(name, path)
}

function handleError (error, isFatal = false) {
  if (isFatal || !Tropy.instance?.ready) {
    return (opts.hidden)
      ? console.error(error)
      : dialog.showErrorBox('Unhandled Error', error?.stack)
  }

  try {
    Tropy.instance.handleUncaughtException(error)
  } catch (err) {
    handleError(err, true)
  }
}
