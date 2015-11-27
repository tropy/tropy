'use strict';

require('shelljs/make');

const gaze = require('gaze');
const electron = require('electron-connect').server.create();

const make = require('./make');

target.all = () => {
  target.src();
  target.lib();
};

target.src = () => {
  gaze('src/**/*.{js,jsx}', function (err) {
    if (err) return console.error(err);

    this.on('all', (event, file) => {
      console.log(event, file);

      if (event === 'deleted') {
        return rm(file);
      }

      make['compile-js'](file);
    });
  });
};

target.lib = () => {
  process.env.ELECTRON_CONNECT = 'true';
  electron.start();

  gaze('lib/**/*.js', function (err)  {
    if (err) return console.error(err);

    this.on('all', (event, file) => {
      console.log(event, file);
      electron[(/\/browser\//).test(file) ? 'restart' : 'reload']();
    });
  });
};
