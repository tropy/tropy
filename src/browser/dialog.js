'use strict'

const { dirname } = require('path')
const { dialog } = require('electron')

let defaultPath

function show(type, win, opts) {
  switch (type) {
    case 'save':
      return dialog
        .showSaveDialog(win, { defaultPath, ...opts })
        .then(({ filePath }) => {
          if (filePath) {
            defaultPath = dirname(filePath)
          }
          return filePath
        })

    case 'file':
      return dialog
        .showOpenDialog(win, { defaultPath, ...opts })
        .then(({ filePaths }) => {
          if (filePaths && filePaths.length) {
            defaultPath = dirname(filePaths[0])
          }
          return filePaths
        })

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
  get lastDefaultPath() {
    return defaultPath
  },

  set lastDefaultPath(lastDefaultPath) {
    defaultPath = lastDefaultPath
  },

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
