'use strict'

const glob = require('glob')
const { resolve, join } = require('path')
const { readFileSync: read, writeFileSync: write } = require('fs')
const { hookRequire } = require('istanbul-lib-hook')
const { createInstrumenter } = require('istanbul-lib-instrument')


function match() {
  const map = {}
  const fn = function (file) { return map[file] }

  fn.files = glob.sync(pattern, { root, realpath: true })
  for (let file of fn.files) map[file] = true

  return fn
}

function report() {
  for (let file of matched.files) {
    if (!cov[file]) {
      // Files that are not touched by code ran by the test runner is
      // manually instrumented, to illustrate the missing coverage.
      transformer(read(file, 'utf-8'), file)
      cov[file] = instrumenter.lastFileCoverage()
    }
  }

  write(join(tmpd, `${process.type}.json`), JSON.stringify(cov), 'utf-8')
}


const instrumenter = createInstrumenter()
const transformer = instrumenter.instrumentSync.bind(instrumenter)
const cov = global.__coverage__ = {}

const root = resolve(__dirname, '..', '..')
const tmpd = resolve(root, '.nyc_output')

const pattern = (process.type === 'browser') ?
  'lib/{browser,common}/**/*.js' :
  '{lib/!(browser)/**,lib}/*.js'

const matched = match()
hookRequire(matched, transformer, {})

if (process.type === 'browser') {
  process.on('exit', report)
} else {
  window.addEventListener('unload', report)
}
