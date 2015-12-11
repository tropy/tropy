'use strict';

const { app } = require('electron');

const tropy = require('./tropy');
const args = require('./args').parse(process.argv.slice(1));

process.env.NODE_ENV = args.mode;

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
    // TODO reopen window on mac
  })

  .once('ready', () => {
    tropy.instance.open();
  });
