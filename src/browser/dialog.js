'use strict'

const { dialog, ipcMain: ipc, BrowserWindow } = require('electron')
const { warn, verbose } = require('../common/log')

module.exports = {

  start() {
    ipc.on('dialog', module.exports.onOpen)
  },

  stop() {
    ipc.removeListener('dialog', module.exports.onOpen)
  },

  onOpen({ sender }, { id, type, options }) {
    module.exports.show(type, BrowserWindow.fromWebContents, options)
      .then(payload => {
        sender.send('dialog.closed', { id, payload })
      })

      .catch(error => {
        warn(`dialog open failed: ${error.message}`)
        verbose(error.stack)
        sender.send('dialog.closed', { id, payload: error, error: true })
      })
  },

  show(type, win, options) {
    return new Promise((resolve, reject) => {
      switch (type) {
        case 'save':
          return dialog.showSaveDialog(win, options, resolve)
        case 'open':
          return dialog.showOpenDialog(win, options, resolve)
        case 'message-box':
          return dialog.showMessageBox(win, options, resolve)
        default:
          reject(`unknown dialog type: ${type}`)
      }
    })
  }
}
