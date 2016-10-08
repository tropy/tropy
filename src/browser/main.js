'use strict'

const START = Date.now()

if (process.env.TROPY_RUN_UNIT_TESTS === 'true') {
  require('electron-mocha')

} else {
  let READY = undefined

  const args = require('./args')
  const opts = args.parse(process.argv.slice(1))

  process.env.NODE_ENV = opts.environment

  require('./path')(opts.dir)

  const { app }  = require('electron')
  const { all }  = require('bluebird')
  const { once } = require('../common/util')
  const { info, verbose } =
    require('../common/log')(app.getPath('userData'), opts)

  if (process.env.NODE_ENV !== 'test') {
    if (app.makeSingleInstance(() => tropy.open(...opts._))) {
      verbose('other instance detected, exiting...')
      app.exit(0)
    }
  }

  verbose(`started in ${opts.e} mode`)
  verbose(`using ${app.getPath('userData')}`)

  const tropy = new (require('./tropy'))(opts)

  tropy.listen()
  tropy.restore()

  if (process.platform === 'darwin') {
    app.on('open-file', (event, file) => {
      event.preventDefault()

      if (!READY) opts._ = [file]
      else tropy.open(file)
    })
  }

  all([
    once(app, 'ready'),
    once(tropy, 'app:restored')

  ]).then(() => {
    READY = Date.now()
    info('ready after %sms', READY - START)

    tropy.open(...opts._)
  })

  app
    .on('quit', (_, code) => {
      verbose(`quit with exit code ${code}`)
    })

}
