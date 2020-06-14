'use strict'

const { basename, resolve, join } = require('path')
const { writeFileSync: write } = require('fs')

const root = resolve(__dirname, '..', '..')
const tmpd = resolve(root, '.nyc_output')

function report() {
  if (typeof __coverage__ !== 'undefined') {
    write(join(tmpd, getCoverageFile()), JSON.stringify(__coverage__))
  }
}

function register(type = process.type) {
  if (type === 'browser') {
    process.on('exit', report)
  } else {
    window.addEventListener('unload', report)
  }
}

function getCoverageFile(type = process.type) {
  return (type === 'browser') ?
    `${type}.json` :
    `${type}-${basename(window.location.pathname, '.html')}.json`
}

if (process.env.COVERAGE) {
  register()
}
