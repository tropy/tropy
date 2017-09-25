'use strict'

require('../common/promisify')
const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')
const { fail, save } = require('../dialog')
const { PROJECT, WIZARD } = require('../constants')
const { create } = require('../models/project')
const { unlinkAsync } = require('fs')
const { debug, info, warn } = require('../common/log')

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
        let { file, name } = payload
        info(`creating new project ${name} in ${file}`)

        if (meta.truncate) await rm(file)

        file = await Database.create(file, create, { name })
        ipc.send(PROJECT.CREATED, { file })

      } catch (error) {
        warn(`failed to create project: ${error.message}`)
        debug(error.stack)

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
          const file = await save.project({ defaultPath: payload })
          dispatch(module.exports.project.update({ file }))

        } catch (error) {
          fail(error)
        }
      }
    }
  }
}
