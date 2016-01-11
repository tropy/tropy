'use strict'

const START_TIME = Date.now()

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment
process.env.DEBUG = opts.debug

require('./path')

const { app } = require('electron')
const { info, verbose } =
  require('../common/log')(app.getPath('userData'))

verbose(`app started in ${opts.e} mode`)
verbose(`using ${app.getPath('userData')}`)

const tropy = new (require('./tropy'))(opts)

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

    info('electron ready after %sms', Date.now() - START_TIME)
  })

  .on('quit', (_, code) => {
    verbose(`app quit with exit code ${code}`)
  })
