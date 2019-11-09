'use strict'

const { dialog } = require('electron')

function show(type, win, opts) {
  switch (type) {
    case 'save':
      return dialog
        .showSaveDialog(win, opts)
        .then(({ filePath }) => filePath)

    case 'file':
      return dialog
        .showOpenDialog(win, opts)
        .then(({ filePaths }) => filePaths)

    case 'message-box':
      return dialog
        .showMessageBox(win, { buttons: ['OK'], ...opts })
        .then(p => ({
          response: p.response,
          checked: p.checkboxChecked
        }))

    default:
      throw new Error(`unknown dialog type: ${type}`)
  }
}

module.exports = {
  alert(win, opts) {
    return show('message-box', win, {
      type: 'error',
      ...opts
    })
  },

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
  }
}
