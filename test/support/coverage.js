/* global window, __coverage__ */

import process from 'node:process'
import { basename, resolve, join } from 'node:path'
import { writeFileSync as write } from 'node:fs'

const root = resolve(import.meta.dirname, '..', '..')
const tmpd = resolve(root, '.nyc_output')

function report() {
  if (typeof __coverage__ !== 'undefined') {
    write(join(tmpd, getCoverageFile()), JSON.stringify(__coverage__))
  } else {
    console.log('no coverage data found')
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
