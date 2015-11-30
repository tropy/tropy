'use strict';

require('shelljs/make');

const assert = require('assert');
const path = require('path');
const babel = require('babel-core');
const glob = require('glob');
const sass = require('node-sass');

const home = path.resolve(__dirname, '..');
const nbin = path.resolve(home, 'node_modules', '.bin');

const mocha = path.join(nbin, 'electron-mocha');
const lint = path.join(nbin, 'eslint');

const electron = process.env.ELECTRON_PATH = require('electron-prebuilt');

const resources = (process.platform === 'darwin') ?
  path.join(electron, 'Contents', 'Resources') :
  path.resolve(electron, '..', 'resources');


target.lint = () => {
  exec(`${lint} --color src test static scripts`);
};


target.test = () => {
  target['lint']();
  target['test-browser']();
  target['test-renderer']();
};

target['test-renderer'] = (pattern) => {
  pattern = pattern || 'test/**/*_test.js';
  let files = glob.sync(pattern, { ignore: 'test/browser/*' });

  exec(`${mocha} --renderer ${files.join(' ')}`, { silent: false });
};

target['test-browser'] = (pattern) => {
  pattern = pattern || 'test/browser/**/*_test.js';
  let files = glob.sync(pattern);

  exec(`${mocha} ${files.join(' ')}`, { silent: false });
};

target.mocha = (args) => {
  args = args || [];
  exec(`${mocha} ${args.join(' ')}`, { silent: false });
};


target.compile = () => {
  target['compile-js']();
  target['compile-css']();
};

target['compile-js'] = (pattern) => {
  new glob
    .Glob(pattern || 'src/**/*.{js,jsx}')
    .on('error', (err) => fail('compile-js', err))

    .on('match', (file) => {
      let src = path.relative(home, file);
      let dst = swap(src, 'src', 'lib', '.js');

      assert(src.startsWith('src'));
      console.log('compiling %s to %s', src, dst);

      babel.transformFile(src, (err, result) => {
        if (err) return fail('compile-js', err);

        mkdir('-p', path.dirname(dst));
        result.code.to(dst);
      });
    });
};

target['compile-css'] = (pattern) => {
  new glob
    .Glob(pattern || 'src/stylesheets/**/!(_*).{sass,scss}')
    .on('error', (err) => fail('compile-css', err))

    .on('match', (file) => {
      let src = path.relative(home, file);
      let dst = swap(src, 'src', 'lib', '.css');

      assert(src.startsWith('src/stylesheets'));
      console.log('compiling %s to %s', src, dst);

      let options = {
        file: src,
        outFile: dst,
        outputStyle: 'compressed',
        sourceMap: true
      };

      sass.render(options, (err, result) => {
        if (err) return fail('compile-css', `${err.line}: ${err.message}`);

        mkdir('-p', path.dirname(dst));
        String(result.css).to(dst);
        String(result.map).to(`${dst}.map`);
      });
    });
};


target.electron = (args) => {
  args = args || [];

  try {
    target.link();
    exec(`${electron} ${args.join(' ')}`, { silent: false });
  } finally {
    target.unlink();
  }
};

target.link = () => {
  ln('-sf', home, path.join(resources, 'app'));
};

target.unlink = () => {
  rm('-f', path.join(resources, 'app'));
};


target.clean = () => {
  target.unlink();
  rm('-rf', path.join(home, 'lib'));
  rm('-rf', path.join(home, 'dist'));
};


function swap(filename, src, dst, ext) {
  return filename
    .replace(src, dst)
    .replace(/(\..+)$/, (m) => ext || m[1]);
}

function fail(mod, reason) {
  console.error('[%s] %s', mod, reason);
}

// We need to make a copy when exposing targets to other scripts,
// because any method on target can be called just once per execution!
module.exports = Object.assign({}, target);
