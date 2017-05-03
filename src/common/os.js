'use strict'

const { release } = require('os')
const { platform } = process
const { qualified } = require('./release')

module.exports = {
  get EL_CAPITAN() {
    return platform === 'darwin' && release() > '15'
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
