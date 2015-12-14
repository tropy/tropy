'use strict';

const istanbul = require('istanbul');

module.exports = function (runner) {
  runner.on('end', function () {
    let reporter = new istanbul.Reporter();
    let collector = new istanbul.Collector();

    collector.add(__coverage__);

    reporter.add('text-summary');
    reporter.add('lcovonly');
    reporter.add('json');
    reporter.add('html');

    reporter.write(collector, true, () => {});
  });
};
