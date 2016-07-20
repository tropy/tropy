'use strict'

const { Database } = require('../common/db')
const { info } = require('../common/log')
const { ipcRenderer: ipc } = require('electron')

const { OPENED, UPDATE } = require('../constants/project')

function open(file) {
  return async (dispatch, getState) => {
    const { project: { file: current } } = getState()
    const db = Database.cached(file)

    if (!current) {
      const project = await db.get(
        'SELECT project_id AS id, name FROM project'
      )

      info(`opened project ${project.id}`)
      ipc.send(OPENED, { file: db.path, id: project.id })
      db.close() // TODO remove

      return dispatch(update({ file: db.path, ...project }))
    }

    if (current === db.path) {
      return // TODO reload
    }

    // TODO replace
    return
  }
}

function update(payload) {
  return {
    type: UPDATE,
    payload
  }
}

module.exports = {
  open,
  update
}
