'use strict'

const { ipcRenderer: ipc } = require('electron')
const { sequence } = require('./common/util')
const { warn } = require('./common/log')

const next = sequence()
const P = {}

ipc.on('dialog', (_, { seq, payload, error }) => {
  try {
    P[seq][error ? 'reject' : 'resolve'](payload)

  } catch (error) {
    warn(`failed to resolve dialog #${seq}: ${error.message}`)

  } finally {
    delete P[seq]
  }
})

module.exports = {
  notify(options) {
    const seq = next()
    P[seq] = Promise.defer()

    ipc.send('dialog', {
      type: 'none',
      buttons: ['OK'],
      ...options
    }, { seq })

    return P[seq].promise
  },

  fail(error, context = 'global') {
    module.exports.notify({
      type: 'error',
      title: 'Error',
      message: `${context}: ${error.message}`
    })
  }
}
