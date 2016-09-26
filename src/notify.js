'use strict'

const { ipcRenderer: ipc } = require('electron')

module.exports = {
  notify(options) {
    ipc.send('dialog', {
      type: 'none',
      buttons: ['OK'],
      ...options
    })
  },

  fail(error, context = 'global') {
    module.exports.notify({
      type: 'error',
      title: 'Error',
      message: `${context}: ${error.message}`
    })
  }
}
