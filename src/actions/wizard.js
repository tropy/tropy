'use strict'

const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')
const { fail, saveProject } = require('../dialog')
const { PROJECT, WIZARD } = require('../constants')
const { create } = require('../models/project')

module.exports = {
  complete(payload) {
    return async () => {
      try {
        const file = await Database.create(payload.file, create, payload)
        ipc.send(PROJECT.CREATED, { file })

      } catch (error) {
        fail(error)
      }
    }
  },

  project: {
    update(payload) {
      return {
        type: WIZARD.PROJECT.UPDATE,
        payload
      }
    },

    save(payload) {
      return async (dispatch) => {
        try {
          const file = await saveProject({ defaultPath: payload })
          dispatch(module.exports.project.update({ file }))

        } catch (error) {
          fail(error)
        }
      }
    }
  }
}
