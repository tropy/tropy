'use strict'

const { SHELL } = require('../constants')
const { array } = require('../common/util')

const shell = module.exports = {
  openLink(payload, meta = {}) {
    return {
      type: SHELL.OPEN_LINK,
      payload: array(payload),
      meta
    }
  },

  openInFolder(payload, meta = {}) {
    return {
      type: SHELL.OPEN_FILE,
      payload: array(payload),
      meta
    }
  },

  open({ protocol, path }, meta = {}) {
    return (protocol === 'file') ?
      shell.openInFolder(path, meta) :
      shell.openLink(`${protocol}://${path}`, meta)
  }
}
