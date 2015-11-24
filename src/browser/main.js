'use strict';

const { app, BrowserWindow } = require('electron');
const { join } = require('path');
const { client } = require('electron-connect');

const ROOT = join(__dirname, '../..');

let win;

app
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  })

  .on('ready', () => {
    win = new BrowserWindow({});

    win.loadURL(`file://${ROOT}/static/index.html`);

    // Enable live-reloading in dev environment
    client.create(win);

    win.once('closed', () => { win = undefined; });
  });
