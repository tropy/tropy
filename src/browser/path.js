'use strict'

const app = require('electron').app
const join = require('path').join

switch (process.env.NODE_ENV) {
  case 'development':
    app.setPath('userData', join(process.cwd(), 'tmp'))
    break
  case 'test':
    app.setPath('userData', join(app.getPath('temp'), 'tropy'))
    break
}
