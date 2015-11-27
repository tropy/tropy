'use strict';

const pkg = require('../../package');

module.exports = require('yargs')
  .usage('Usage: $0')
  .wrap(78)

  .help('help')
  .version(pkg.version);
