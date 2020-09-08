import { ipcRenderer as ipc } from 'electron'
import fs from 'fs'
import { fail, save } from '../dialog'
import { PROJECT, WIZARD } from '../constants'
import mod from '../models/project'
import { info, warn } from '../common/log'

async function rm(file) {
  try {
    await fs.promises.unlink(file)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
}

const project = {
  update(payload) {
    return {
      type: WIZARD.PROJECT.UPDATE,
      payload
    }
  },

  save(payload) {
    return async (dispatch) => {
      let file = await save.project({ defaultPath: payload })
      if (file) {
        dispatch(project.update({ file }))
      }
    }
  }
}

const wizard = {
  complete(payload, meta = {}) {
    return async () => {
      try {
        let { Database } = await import('../common/db')
        let { file, name, base } = payload
        info(`creating new project ${name} in ${file}`)

        if (meta.truncate) await rm(file)

        file = await Database.create(file, mod.create, { name, base })
        ipc.send(PROJECT.CREATED, { file })

      } catch (e) {
        warn(e)
        await fail(e, PROJECT.CREATED)
        if (meta.truncate) await rm(payload.file)
      }
    }
  }
}

export default {
  project,
  wizard
}
