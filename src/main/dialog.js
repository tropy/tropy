import { join, dirname } from 'node:path'
import { dialog } from 'electron'
import { warn } from '../common/log.js'

export class DialogService {
  constructor (app) {
    this.app = app
  }

  alert (win, opts) {
    return this.show('message-box', win, {
      type: 'error',
      ...opts
    })
  }

  open (win, opts) {
    return this.show('file', win, {
      properties: ['openFile'],
      ...opts
    })
  }

  save (win, opts) {
    return this.show('save', win, opts)
  }

  async show (type, win, opts) {
    let { state } = this.app

    if (this.app.hidden) {
      warn({ type, message: opts?.message }, 'dialog canceled in hidden mode')
      return { cancel: true, value: null, data: null }
    }

    switch (type) {
      case 'save': {
        let { canceled, filePath } = await dialog.showSaveDialog(win, {
          defaultPath: join(
            opts.defaultPath || state.lastDefaultPath || '',
            opts.filename || ''),
          properties: ['createDirectory'],
          ...opts
        })

        if (canceled || !filePath)
          return {
            cancel: true,
            value: null,
            data: null
          }

        state.lastDefaultPath = dirname(filePath)
        return {
          cancel: false,
          value: filePath,
          data: null
        }
      }

      case 'file': {
        let { canceled, filePaths } = await dialog.showOpenDialog(win, {
          defaultPath: state.lastDefaultPath,
          ...opts
        })

        if (canceled || !filePaths?.length)
          return { cancel: true, value: [], data: null }

        state.lastDefaultPath = dirname(filePaths[0])
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
  }

  warn (win, opts) {
    return this.show('message-box', win, {
      type: 'warning',
      ...opts
    })
  }
}
