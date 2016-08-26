'use strict'

const { Database } = require('../common/db')
const { info } = require('../common/log')
const { ipcRenderer: ipc } = require('electron')
const { persist, restore } = require('./nav')
const { createAction: action } = require('redux-actions')

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

    dispatch(restore(project.id))
    return dispatch(update({ file: db.path, ...project }))
  }
}

function close() {
  return async (dispatch, getState) => {
    const { project: { id, file } } = getState()

    dispatch(persist(id))

    await Database.cached(file).close()
    info(`closed project ${id}`)

    dispatch(update({}))
  }
}

const update = action(UPDATE,
  (payload) => payload,
  (_, { debounce } = {}) => ({ debounce }))

module.exports = {
  open,
  close,
  update
}
