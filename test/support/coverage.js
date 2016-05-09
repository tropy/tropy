'use strict'

const path = require('path')
const istanbul = require('istanbul')

// Override __src to point to instrumented sources!
global.__src = path.resolve(__dirname, '..', '..', 'lib')

const reporter = new istanbul.Reporter()
reporter.addAll(['text-summary', 'json'])

istanbul.matcherFor({
  root: path.resolve(__dirname, '..', '..'),
  includes: ['lib/**/*.js']
}, (err, match) => {

  let instrumenter = new istanbul.Instrumenter()
  let transformer = instrumenter.instrumentSync.bind(instrumenter)

  istanbul.hook.hookRequire(match, transformer, {})

  global.__coverage__ = {}
})

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
