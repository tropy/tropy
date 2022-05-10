import { dirname } from 'path'
import { dialog } from 'electron'

let defaultPath

const Dialog = {
  get lastDefaultPath() {
    return defaultPath
  },

  set lastDefaultPath(lastDefaultPath) {
    defaultPath = lastDefaultPath
  },

  alert(win, opts) {
    return Dialog.show('message-box', win, {
      type: 'error',
      ...opts
    })
  },

  open(win, opts) {
    return Dialog.show('file', win, {
      properties: ['openFile'],
      ...opts
    })
  },

  save(win, opts) {
    return Dialog.show('save', win, opts)
  },

  show(type, win, opts) {
    switch (type) {
      case 'save':
        return dialog
          .showSaveDialog(win, {
            defaultPath,
            properties: ['createDirectory'],
            ...opts
          })
          .then(({ filePath }) => {
            if (filePath) {
              defaultPath = dirname(filePath)
            }
            return filePath
          })

      case 'file':
        return dialog
          .showOpenDialog(win, { defaultPath, ...opts })
          .then(({ filePaths }) => {
            if (filePaths && filePaths.length) {
              defaultPath = dirname(filePaths[0])
            }
            return filePaths
          })

      case 'message-box':
        return dialog
          .showMessageBox(win, { buttons: ['OK'], ...opts })
          .then(p => ({
            response: p.response,
            checked: p.checkboxChecked
          }))

      default:
        throw new Error(`unknown dialog type: ${type}`)
    }
  },

  warn(win, opts) {
    return Dialog.show('message-box', win, {
      type: 'warning',
      ...opts
    })
  }
}

export default Dialog
