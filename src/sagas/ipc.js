'use strict'

const { takeEvery: every } = require('redux-saga')
const { ipcRenderer: ipc } = require('electron')


module.exports = {

  forward({ type, payload, meta }) {
    if (meta && meta.ipc) ipc.send(type, payload)
  },

  *ipc() {
    yield* every('*', module.exports.forward)
  }

}
