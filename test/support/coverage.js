'use strict'

const { resolve, join } = require('path')
const { writeFileSync: write } = require('fs')

const root = resolve(__dirname, '..', '..')
const tmpd = resolve(root, '.nyc_output')

function report() {
  write(join(tmpd, `${process.type}.json`), JSON.stringify(__coverage__))
}

function register(type = process.type) {
  if (type === 'browser') {
    process.on('exit', report)
  } else {
    window.addEventListener('unload', report)
  }
}

if (process.env.COVERAGE) {
  register()
}
