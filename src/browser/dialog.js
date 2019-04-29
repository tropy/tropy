'use strict'

const { dialog } = require('electron')

function show(type, win, opts) {
  return new Promise((resolve, reject) => {
    switch (type) {
      case 'save':
        dialog.showSaveDialog(win, opts, resolve)
        break
      case 'file':
        dialog.showOpenDialog(win, opts, resolve)
        break
      case 'message-box':
        dialog.showMessageBox(win, opts, (response, checked) => {
          resolve({ response, checked })
        })
        break
      default:
        reject(new Error(`unknown dialog type: ${type}`))
    }
  })
}

module.exports = {
  open(win, opts) {
    return show('file', win, {
      properties: ['openFile'],
      ...opts
    })
  },

  show,

  warn(win, opts) {
    return show('message-box', win, {
      type: 'warning',
      ...opts
    })
  },
}
