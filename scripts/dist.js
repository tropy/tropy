'use strict';

require('shelljs/make');

const packager = require('electron-packager');
const pkg = require('../package');
const path = require('path');

const home = path.resolve(__dirname, '..');
const electron = require('electron-prebuilt/package');

target.all = () => {
  target.pack();
};

target.pack = (args) => {
  args = args || ['all', 'all'];

  packager({ // eslint-disable-line quote-props
    dir: home,
    out: path.join(home, 'dist'),
    name: pkg.productName,
    platform: args[0],
    arch: args[1],
    version: electron.version,
    asar: true,
    'app-version': pkg.version,
    prune: true,
    overwrite: true,
    ignore: [
      '/node_modules/.bin',
      '/dist',
      '/src',
      '/scripts'
    ]

  }, (err, dst) => {
    if (err) return console.error(err);
    console.log('%s package written to %s', args[0], dst);
  });
};

exports.package = target.pack;
