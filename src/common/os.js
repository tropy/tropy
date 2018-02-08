'use strict'

const os = require('os')
const { arch, platform } = process
const { qualified } = require('./release')

module.exports = {
  get EL_CAPITAN() {
    return platform === 'darwin' && os.release() > '15'
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
Exec=${exec} %f
Icon=${qualified.name}
StartUpNotify=true
MimeType=application/vnd.tropy.tpy;image/jpeg;
Categories=Graphics;Viewer;Science;`
  }
}
