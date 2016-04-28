'use strict'

const { app } = require('electron')
const { join } = require('path')
const { mkdtempSync: mkdtemp } = require('fs')

switch (process.env.NODE_ENV) {
  case 'development':
    app.setPath('userData', join(process.cwd(), 'tmp'))
    break
  case 'test':
    app.setPath('userData', mkdtemp(join(app.getPath('temp'), 'tropy-')))
    break
}
