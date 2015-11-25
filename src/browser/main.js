'use strict';

const { app, BrowserWindow } = require('electron');
const { join } = require('path');

const ROOT = join(__dirname, '../..');

let win;

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  })

  .on('ready', () => {
    win = new BrowserWindow({});

    win.loadURL(`file://${ROOT}/static/index.html`);

    if (process.env.ELECTRON_CONNECT) {
      require('electron-connect').client.create(win);
    }

    win.once('closed', () => { win = undefined; });
  });
