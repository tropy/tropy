'use strict';

const path = require('path');
const istanbul = require('istanbul');

const resolve = path.resolve;

const REPORTERS = ['text-summary', 'json'];

// Override __src to point to instrumented sources!
global.__src = resolve(__dirname, '..', '..', 'src-cov');

module.exports = function (runner) {
  runner.on('end', function () {
    let reporter = new istanbul.Reporter();
    let collector = new istanbul.Collector();

    collector.add(__coverage__);

    reporter.addAll(REPORTERS);
    reporter.write(collector, true, () => {});
  });
};
