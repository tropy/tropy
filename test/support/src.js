'use strict';

const path = require('path');
const resolve = path.resolve;
const join = path.join;

// __src can also point to instrumented sources during coverage tests!
if (!global.__src) {
  global.__src = resolve(__dirname, '..', '..', 'src');
}

global.__require = function (mod) {
  return require(join(global.__src, mod));
};
