'use strict'

const START_TIME = Date.now()

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment
process.env.DEBUG = opts.debug

const { app } = require('electron')
const { join } = require('path')

if (opts.environment !== 'production') {
  app.setPath('userData', join(process.cwd(), 'tmp', opts.environment))
}

const { info, debug } = require('../common/log')(app.getPath('userData'))

const tropy = new (require('./tropy'))(opts)

if (opts.environment !== 'test') {
  if (app.makeSingleInstance(() => tropy.open())) {
    debug('other live instance detected, exiting...')
    app.exit(0)
  }
}

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  .on('activate', () => tropy.open())

  .once('ready', () => {
    tropy.open()

    info('application ready after %sms', Date.now() - START_TIME)
  })
