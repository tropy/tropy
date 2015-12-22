'use strict'

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment

const { app } = require('electron')
const { join } = require('path')

if (opts.environment !== 'production') {
  app.setPath('userData', join(process.cwd(), 'tmp', opts.environment))
}

const { info } =
  require('../common/log')(opts.environment, app.getPath('userData'))

const tropy = new (require('./tropy'))(opts)

if (opts.environment !== 'test') {
  if (app.makeSingleInstance(() => tropy.open())) app.exit(0)
}

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  .on('activate', () => tropy.open())

  .once('ready', () => {
    info('ready')
    tropy.open()
  })
