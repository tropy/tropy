'use strict'

const os = require('os')
const { arch, platform } = process
const { qualified } = require('./release')
const { SUPPORTED } = require('../constants/image')

module.exports = {
  get EL_CAPITAN() {
    return platform === 'darwin' && os.release() > '15'
  },

  get home() {
    return os.homedir()
  },

  get darwin() {
    return platform === 'darwin'
  },

  get linux() {
    return platform === 'linux'
  },

  get win32() {
    return platform === 'win32'
  },

  get system() {
    return `${os.type()} ${os.release()} (${arch})`
  },

  normalize: platform === 'win32' ?
    (path) => path :
    (path) => path.replace(/\\/g, '/'),

  meta: platform === 'darwin' ?
    (event) => event.metaKey :
    (event) => event.ctrlKey,

  desktop(exec = qualified.name) {
    return `#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=${qualified.product}
Exec=${exec} %u
Icon=${qualified.name}
MimeType=application/vnd.tropy.tpy;x-scheme-handler/tropy;${
  Object.keys(SUPPORTED).join(';')
};
Categories=Graphics;Viewer;Science;`
  }
}
