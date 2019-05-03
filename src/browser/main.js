'use strict'

const START = Date.now()

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment
global.ARGS = opts

const { app }  = require('electron')
const { extname, join } = require('path')
const { darwin, linux, win32, system }  = require('../common/os')
const { qualified, version }  = require('../common/release')

if (opts.environment !== 'test') {
  if (!app.requestSingleInstanceLock()) {
    process.stderr.write('other instance detected, exiting...\n')
    app.exit(0)
  }
}

let USERDATA = opts.dir
let LOGDIR

if (!USERDATA) {
  switch (opts.environment) {
    case 'development':
      USERDATA = join(process.cwd(), 'tmp')
      break
    case 'production':
      USERDATA = join(
        app.getPath('appData'),
        qualified[linux ? 'name' : 'product'])
      break
  }
}

// Set app name and data location as soon as possible!
app.setName(qualified.product)
if (USERDATA) {
  app.setPath('userData', USERDATA)
}

try {
  LOGDIR = app.getPath('logs')
} catch (_) {
  LOGDIR = join(app.getPath('userData'), 'log')
  app.setPath('logs', LOGDIR)
}

if (!(win32 && require('./squirrel')())) {
  const { info, warn } = require('../common/log')({
    dest: join(LOGDIR, 'tropy.log'),
    name: 'main'
  })

  if (opts.ignoreGpuBlacklist) {
    app.commandLine.appendSwitch('ignore-gpu-blacklist')
  }

  if (opts.scale) {
    app.commandLine.appendSwitch('force-device-scale-factor', opts.scale)
  }

  info(`main.init ${version} ${system}`, {
    env: opts.environment,
    user: app.getPath('userData'),
    version
  })

  const T1 = Date.now()
  const Tropy = require('./tropy')
  const tropy = new Tropy()
  const T2 = Date.now()

  Promise.all([
    app.whenReady(),
    tropy.start()
  ])
    .then(() => {
      info(`ready after ${Date.now() - START}ms [req:${T2 - T1}ms]`)
      tropy.isReady = true
      tropy.open(...opts._)
    })

  if (darwin) {
    app.on('open-file', (event, file) => {
      if (tropy.isReady) {
        if (tropy.open(file))
          event.preventDefault()
      } else {
        if (extname(file) === '.tpy') {
          opts._.push(file)
          event.preventDefault()
        }
      }
    })
  }

  app.on('second-instance', (_, argv) => {
    if (tropy.isReady)
      tropy.open(...args.parse(argv.slice(1))._)
  })

  app.on('web-contents-created', (_, contents) => {
    contents.on('new-window', (event, url) => {
      warn(`prevented loading ${url}`)
      event.preventDefault()
    })
  })

  app.on('window-all-closed', () => {
    if (!darwin) app.quit()
  })

  // TODO handle win32 logout/shutdown which does not trigger quit event!
  app.on('quit', (_, code) => {
    if (tropy.isReady) tropy.stop()
    info(`quit with exit code ${code}`, { quit: true, code })
  })

  const handleError = (error, isFatal = false) => {
    if (isFatal || !tropy.isReady) {
      require('electron')
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
  process.on('unhandledRejection', handleError)
}
