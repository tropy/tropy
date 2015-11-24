'use strict';

require('shelljs/make');

const join = require('path').join;
const babel = require('babel-core');
const gaze = require('gaze');
const electron = require('electron-connect').server.create();

const cwd = process.cwd();

target.all = () => {
  target.src();
  target.lib();
};

target.src = () => {
  gaze('src/**/*.js', function (err) {
    if (err) return console.error(err);

    this.on('all', (event, path) => {
      console.log(event, path);

      if (event === 'deleted') {
        return rm(path);
      }

      compile(path, swap(path, 'src', 'lib'));
    });
  });
};

target.lib = () => {
  electron.start();

  gaze('lib/**/*.js', function (err)  {
    if (error) return console.error(err);

    this.on('all', (event, path) => {
      console.log(event, path);
      electron[(/\/browser\//).test(path) ? 'restart' : 'reload']();
    });
  });
};


function compile(src, dst) {
  babel.transformFile(src, (err, result) => {
    if (err) return console.error(err);
    result.code.to(dst);
  });
}

function swap(path, src, dst) {
  return path.replace(join(cwd, src), join(cwd, dst));
}
