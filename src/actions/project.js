'use strict'

const { Database } = require('../common/db')
const { info } = require('../common/log')
const { ipcRenderer: ipc } = require('electron')
const { persist, restore } = require('./nav')

const { OPENED, UPDATE, SAVE } = require('../constants/project')

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

    dispatch(restore(project.id))
    return dispatch(update({ file: db.path, ...project }))
  }
}

function close() {
  return async (dispatch, getState) => {
    const { project } = getState()

    dispatch(persist(project.id))

    await Database.cached(project.file).close()
    info(`closed project ${project.id}`)

    dispatch(update({}))
  }
}

function save(payload) {
  return { type: SAVE, payload }
}

function update(payload, meta) {
  return { type: UPDATE, payload, meta }
}

module.exports = {
  open,
  close,
  save,
  update
}
