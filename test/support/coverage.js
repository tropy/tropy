'use strict'

const { resolve, join } = require('path')
const { writeFileSync: write } = require('fs')


function report() {
  write(join(tmpd, `${process.type}.json`), JSON.stringify(__coverage__))
}

const root = resolve(__dirname, '..', '..')
const tmpd = resolve(root, '.nyc_output')

if (process.type === 'browser') {
  process.on('exit', report)
} else {
  window.addEventListener('unload', report)
}
