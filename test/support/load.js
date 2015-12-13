'use strict';

const path = require('path');
const home = path.resolve(__dirname, '..', '..');

global.load = function (mod) {
  return require(
      path.join(home, process.env.COVERAGE ? 'src-cov' : 'src', mod));
};
