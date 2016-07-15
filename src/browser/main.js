'use strict'

const START_TIME = Date.now()

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment
process.env.DEBUG = opts.debug

require('./path')

const { app }  = require('electron')
const { all }  = require('bluebird')
const { once } = require('../common/util')
const { info, verbose } =
  require('../common/log')(app.getPath('userData'))

if (app.makeSingleInstance(() => tropy.open(...opts._))) {
  verbose('other live instance detected, exiting...')
  app.exit(0)
}

verbose(`started in ${opts.e} mode`)
verbose(`using ${app.getPath('userData')}`)

const tropy = new (require('./tropy'))(opts)

tropy.listen()
tropy.restore()

all([
  once(app, 'ready'),
  once(tropy, 'app:restore')

]).then(() => {
  tropy.open(...opts._)
})

app
  .once('ready', () => {
    info('electron ready after %sms', Date.now() - START_TIME)
  })

  .on('quit', (_, code) => {
    verbose(`quit with exit code ${code}`)
  })
