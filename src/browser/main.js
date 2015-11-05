'use strict';

const app = require('app');
const { join } = require('path');
const BrowserWindow = require('browser-window');

const ROOT = join(__dirname, '../..');

let win;

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  })

  .on('ready', () => {
    win = new BrowserWindow({});

    win.loadUrl(`file://${ROOT}/static/index.html`);

    win.once('closed', () => { win = undefined; });
  });
