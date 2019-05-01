'use strict'

require('../common/promisify')
const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')
const { fail, save } = require('../dialog')
const { PROJECT, WIZARD } = require('../constants')
const { create } = require('../models/project')
const { unlinkAsync } = require('fs')
const { info, warn } = require('../common/log')

async function rm(file) {
  try {
    await unlinkAsync(file)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

module.exports = {
  complete(payload, meta = {}) {
    return async () => {
      try {
        let { file, name, base } = payload
        info(`creating new project ${name} in ${file}`)

        if (meta.truncate) await rm(file)

        file = await Database.create(file, create, { name, base })
        ipc.send(PROJECT.CREATED, { file })

      } catch (error) {
        warn(`failed to create project: ${error.message}`, {
          stack: error.stack
        })

        fail(error, PROJECT.CREATED)
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
          let file = await save.project({ defaultPath: payload })
          if (file) {
            dispatch(module.exports.project.update({ file }))
          }
        } catch (error) {
          fail(error)
        }
      }
    }
  }
}
