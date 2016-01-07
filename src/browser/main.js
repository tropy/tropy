'use strict'

const START_TIME = Date.now()

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment
process.env.DEBUG = opts.debug

const { app, Menu } = require('electron')
const { join } = require('path')

if (opts.environment !== 'production') {
  app.setPath('userData', join(process.cwd(), 'tmp', opts.environment))
}

const { info, verbose } =
  require('../common/log')(app.getPath('userData'))

const tropy = new (require('./tropy'))(opts)
const res = require('../common/res')

res.Menu.open('app').then(menu => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu.template))
})

if (opts.environment !== 'test') {
  if (app.makeSingleInstance(() => tropy.open())) {
    verbose('other live instance detected, exiting...')
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

    info('app ready after %sms', Date.now() - START_TIME)
  })
