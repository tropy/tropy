'use strict'

const path = require('path')
const istanbul = require('istanbul')

// Override __src to point to instrumented sources!
global.__src = path.resolve(__dirname, '..', '..', 'src-cov')

const reporter = new istanbul.Reporter()
reporter.addAll(['text-summary', 'json'])

function done() {
  // Check for global variable
  // Touch uncovered files
  let collector = new istanbul.Collector()

  collector.add(__coverage__)

  reporter.write(collector, true, () => {})
}

if (process.type === 'browser') {
  process.on('exit', done)
} else {
  window.addEventListener('mocha-done', done)
}
