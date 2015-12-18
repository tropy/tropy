'use strict'

const path = require('path')
const istanbul = require('istanbul')
const mocha = require('mocha')
const util = require('util')

// Override __src to point to instrumented sources!
global.__src = path.resolve(__dirname, '..', '..', 'src-cov')

module.exports = Cover

function Cover(runner) {
  mocha.reporters.Dot.call(this, runner)

  runner.on('end', function () {
    let reporter = new istanbul.Reporter()
    let collector = new istanbul.Collector()

    collector.add(__coverage__)

    reporter.addAll(['text-summary', 'json'])
    reporter.write(collector, true, () => {})
  })
}

util.inherits(Cover, mocha.reporters.Dot)
