import { join, dirname } from 'node:path'
import { dialog } from 'electron'

let defaultPath

const Dialog = {
  get lastDefaultPath () {
    return defaultPath
  },

  set lastDefaultPath (lastDefaultPath) {
    defaultPath = lastDefaultPath
  },

  alert (win, opts) {
    return Dialog.show('message-box', win, {
      type: 'error',
      ...opts
    })
  },

  open (win, opts) {
    return Dialog.show('file', win, {
      properties: ['openFile'],
      ...opts
    })
  },

  save (win, opts) {
    return Dialog.show('save', win, opts)
  },

  async show (type, win, opts) {
    switch (type) {
      case 'save': {
        let { canceled, filePath } = await dialog.showSaveDialog(win, {
          defaultPath:
            join(opts.defaultPath || defaultPath || '', opts.filename || ''),
          properties: ['createDirectory'],
          ...opts
        })

        if (canceled || !filePath)
          return {
            cancel: true,
            value: null,
            data: null
          }

        defaultPath = dirname(filePath)
        return {
          cancel: false,
          value: filePath,
          data: null
        }
      }

      case 'file': {
        let { canceled, filePaths } = await dialog.showOpenDialog(win, {
          defaultPath,
          ...opts
        })

        if (canceled || !filePaths?.length)
          return { cancel: true, value: [], data: null }

        defaultPath = dirname(filePaths[0])
        return {
          cancel: false,
          value: filePaths,
          data: null
        }
      }

      case 'message-box': {
        let { response, checkboxChecked } = await dialog.showMessageBox(win, {
          buttons: ['OK'],
          ...opts
        })

        return {
          cancel: response === (opts.cancelId ?? 0),
          value: response,
          data: {
            checked: checkboxChecked
          }
        }
      }

      default:
        throw new Error(`unknown dialog type: ${type}`)
    }
  },

  warn (win, opts) {
    return Dialog.show('message-box', win, {
      type: 'warning',
      ...opts
    })
  }
}

export default Dialog
