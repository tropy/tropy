'use strict';

require('shelljs/make');

const path = require('path');
const glob = require('glob');

const home = path.resolve(__dirname, '..');
const nbin = path.resolve(home, 'node_modules', '.bin');

const mocha = path.join(nbin, 'electron-mocha');
const lint = path.join(nbin, 'eslint');

process.env.ELECTRON_PATH = require('electron-prebuilt');


target.lint = () => {
  exec(`${lint} --color src test static scripts`);
};


target.test = () => {
  target['lint']();
  target['test-browser']();
  target['test-renderer']();
};

target['test-renderer'] = (args) => {
  let pattern = args || 'test/**/*_test.js';
  let files = glob.sync(pattern, { ignore: 'test/browser/*' });

  exec(`${mocha} --renderer ${files.join(' ')}`, { silent: false });
};

target['test-browser'] = (args) => {
  let pattern = args || 'test/browser/**/*_test.js';
  let files = glob.sync(pattern);

  exec(`${mocha} ${files.join(' ')}`, { silent: false });
};


target.compile = () => {
};


target.clean = () => {
  rm('-rf', path.join(home, 'lib'));
  rm('-rf', path.join(home, 'dist'));
};
