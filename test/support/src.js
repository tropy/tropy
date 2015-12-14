'use strict';

const resolve = require('path').resolve;

global.__src = function (mod) {
  return process.env.COVERAGE ?
    resolve(__dirname, '..', '..', 'src-cov', mod) :
    resolve(__dirname, '..', '..', 'src', mod);
};
