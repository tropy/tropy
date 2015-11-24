'use strict';

require('shelljs/make');

const assert = require('assert');
const path = require('path');
const babel = require('babel-core');
const glob = require('glob');

const home = path.resolve(__dirname, '..');

target.all = () => {
  target.js();
};

target.js = (args) => {
  let selection = args && args[0] || 'src/**/*.js';

  glob(selection, function (err, files) {
    if (err) return console.error(err);
    files.forEach(exports.compile);
  });
};


exports.compile = function (file) {
  let src = path.relative(home, file);
  let dst = src.replace('src', 'lib');

  assert(src.startsWith('src'));
  console.log('compiling %s to %s', src, dst);

  babel.transformFile(src, (err, result) => {
    if (err) return console.error(err);

    mkdir('-p', path.dirname(dst));
    result.code.to(dst);
  });
};
