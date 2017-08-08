'use strict'

const { dialog, ipcMain: ipc, BrowserWindow } = require('electron')
const { warn, verbose } = require('../common/log')


function show(type, win, options) {
  return new Promise((resolve, reject) => {
    switch (type) {
      case 'save':
        dialog.showSaveDialog(win, options, resolve)
        break
      case 'file':
        dialog.showOpenDialog(win, options, resolve)
        break
      case 'message-box':
        dialog.showMessageBox(win, options, (response, checked) => {
          resolve({ response, checked })
        })
        break
      default:
        reject(`unknown dialog type: ${type}`)
    }
  })
}

function onOpen({ sender }, { id, type, options }) {
  show(type, BrowserWindow.fromWebContents(sender), options)
    .then(payload => {
      sender.send('dialog', { id, payload })
    })
    .catch(error => {
      warn(`dialog open failed: ${error.message}`)
      verbose(error.stack)

      sender.send('dialog', { id, payload: {
        message: error.message
      }, error: true })
    })
}

module.exports = {
  start() {
    ipc.on('dialog', onOpen)
  },

  stop() {
    ipc.removeListener('dialog', onOpen)
  },

  onOpen,
  show
}
