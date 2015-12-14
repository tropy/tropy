'use strict';

const path = require('path');
const exists = require('fs').existsSync;
const read = require('fs').readFileSync;

const istanbul = require('istanbul');

const dir = path.resolve(__dirname, '..', '..', 'coverage');
let prev;

// Add results from previous browser/renderer tests
if (exists(path.join(dir, 'coverage-final.json'))) {
  prev = JSON.parse(read('coverage-final.json', 'utf8'));
}

module.exports = function (runner) {
  runner.on('end', function () {
    let reporter = new istanbul.Reporter(null, dir);
    let collector = new istanbul.Collector();

    if (prev) collector.add(prev);
    collector.add(__coverage__);

    reporter.add('text-summary');
    reporter.add('lcovonly');
    reporter.add('json');
    reporter.add('html');

    reporter.write(collector, true, () => {});
  });
};
