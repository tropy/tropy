import { SHELL } from '../constants'
import { array } from '../common/util'

function openLink(payload, meta = {}) {
  return {
    type: SHELL.OPEN_LINK,
    payload: array(payload),
    meta
  }
}

function openInFolder(payload, meta = {}) {
  return {
    type: SHELL.OPEN_FILE,
    payload: array(payload),
    meta
  }
}

function open({ protocol, path }, meta = {}) {
  return (protocol === 'file') ?
    openInFolder(path, meta) :
    openLink(`${protocol}://${path}`, meta)
}

export default {
  open,
  openInFolder,
  openLink
}
