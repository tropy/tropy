'use strict'

const { Database } = require('../common/db')
const { Storage } = require('../storage')
const { info } = require('../common/log')
const { ipcRenderer: ipc } = require('electron')

const { OPENED, UPDATE } = require('../constants/project')

function open(file) {
  return async (dispatch, getState) => {
    const { project: { file: current } } = getState()
    const db = Database.cached(file)

    if (current && current !== db.path) {
      await dispatch(close())
    }

    const project = await db.get(
      'SELECT project_id AS id, name FROM project'
    )

    info(`opened project ${project.id}`)
    ipc.send(OPENED, { file: db.path, id: project.id })

    return dispatch(update({ file: db.path, ...project }))
  }
}

function close() {
  return async (dispatch, getState) => {
    const { project, nav } = getState()

    Storage.save('nav', nav, project.id)

    await Database.cached(project.file).close()
    info(`closed project ${project.id}`)

    dispatch(update({}))
  }
}

function update(payload, { debounce } = {}) {
  return {
    meta: { debounce },
    type: UPDATE,
    payload
  }
}

module.exports = {
  open,
  close,
  update
}
