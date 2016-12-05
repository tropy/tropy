'use strict'

const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')

const { CREATED } = require('../constants/project')

module.exports = {
  submit(payload) {
    return async () => {
      try {
        const file = await Database.create(payload.file, payload)
        ipc.send(CREATED, { file })
      } catch (error) {
        //console.error(error.message)
      }
    }
  }
}
