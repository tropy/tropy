'use strict'

const { app } = require('electron')

const Tropy = require('./tropy')
const args = require('./args').parse(process.argv.slice(1))

process.env.NODE_ENV = args.environment

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
    // TODO reopen window on mac
  })

  .once('ready', () => {
    new Tropy().open()
  })
