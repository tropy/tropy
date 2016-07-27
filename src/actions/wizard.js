'use strict'

const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')
const { join } = require('path')
const win = require('../window')

const { CREATED } = require('../constants/project')

function submit() {
  return async (dispatch, getState) => {
    const { project } = getState()

    const file = await Database.create(
      join(ARGS.home, `${project.name}.tpy`), project)

    ipc.send(CREATED, { file })
    win.current.close()
  }
}

module.exports = {
  submit
}
