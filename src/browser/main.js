'use strict'

const args = require('./args')
const opts = args.parse(process.argv.slice(1))

process.env.NODE_ENV = opts.environment

const { app } = require('electron')
const Tropy = require('./tropy')
const tropy = new Tropy(opts)

if (app.makeSingleInstance(() => tropy.open())) app.exit(0)

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
    // TODO reopen window on mac
  })

  .once('ready', () => {
    tropy.open()
  })
