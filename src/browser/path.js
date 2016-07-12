'use strict'

const { app } = require('electron')
const { join } = require('path')

switch (process.env.NODE_ENV) {
  case 'development':
    app.setPath('userData', join(process.cwd(), 'tmp'))
    break
}
