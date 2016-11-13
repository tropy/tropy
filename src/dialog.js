'use strict'

const assert = require('assert')
const { ipcRenderer: ipc } = require('electron')
const { counter } = require('./common/util')
const { warn } = require('./common/log')


const dialog = {

  start() {
    assert(!dialog.seq, 'already initialized')

    dialog.seq = counter()
    dialog.pending = {}

    ipc.on('dialog.closed', dialog.onClosed)
  },

  stop() {
    ipc.removeListener('dialog.closed', dialog.onClosed)

    delete dialog.seq
    delete dialog.pending
  },

  onClosed(_, { id, payload, error }) {
    try {
      dialog.pending[id][error ? 'reject' : 'resolve'](payload)

    } catch (error) {
      warn(`failed to resolve dialog #${id}: ${error.message}`)

    } finally {
      delete dialog.pending[id]
    }
  },

  open(type, options) {
    const id = dialog.seq.next()

    ipc.send('dialog', { id, type, options })

    dialog.pending[id] = Promise.defer()
    return dialog.pending[id].promise
  },

  notify(options) {
    return dialog.open('message-box', {
      type: 'none', buttons: ['OK'], ...options
    })
  },

  fail(error, context = 'global') {
    return dialog.notify({
      type: 'error',
      title: 'Error',
      message: `${context}: ${error.message}`
    })
  }
}

module.exports = dialog
