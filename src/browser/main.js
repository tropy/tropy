'use strict'

const START = Date.now()

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment
global.ARGS = opts

const { app }  = require('electron')
const { join } = require('path')
const { qualified }  = require('../common/release')

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
        qualified[process.platform === 'linux' ? 'name' : 'product'])
      break
  }
}

// Set app name and data location as soon as possible!
app.setName(qualified.product)
if (USERDATA) {
  app.setPath('userData', USERDATA)
  LOGDIR = join(USERDATA, 'log')
}

if (!require('./squirrel')()) {
  const { once } = require('../common/util')
  const { info, warn, verbose } = require('../common/log')(LOGDIR, opts)

  if (opts.environment !== 'test') {
    if (!app.requestSingleInstanceLock()) {
      verbose('other instance detected, exiting...')
      app.exit(0)
    }
  }

  if (opts.ignoreGpuBlacklist) {
    app.commandLine.appendSwitch('ignore-gpu-blacklist')
  }

  if (opts.scale) {
    app.commandLine.appendSwitch('force-device-scale-factor', opts.scale)
  }

  verbose(`using ${app.getPath('userData')}`)

  const tropy = new (require('./tropy'))()

  tropy.listen()
  tropy.restore()

  Promise.all([
    once(app, 'ready'),
    once(tropy, 'app:restored')
  ])
    .then(() => {
      info('ready after %sms', Date.now() - START)
      tropy.open(...opts._)
    })

  app.on('second-instance', (_, argv) => {
    tropy.open(...args.parse(argv.slice(1))._)
  })

  app.on('quit', (_, code) => {
    verbose(`quit with exit code ${code}`)
  })

  app.on('web-contents-created', (_, contents) => {
    contents.on('new-window', (event, url) => {
      warn(`prevented loading ${url}`)
      event.preventDefault()
    })
  })
}
