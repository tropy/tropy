'use strict';

const { app, BrowserWindow } = require('electron');
const { join } = require('path');

require('./args').parse(process.argv.slice(1));
const ROOT = join(__dirname, '../..');

let win;

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
    // TODO reopen window on mac
  })

  .on('ready', () => {
    win = new BrowserWindow({});

    win.loadURL(`file://${ROOT}/static/index.html`);

    win.once('closed', () => { win = undefined; });
  });
