'use strict'

require('shelljs/make')

const { join, resolve } = require('path')
const electron = process.env.ELECTRON_PATH = require('electron-prebuilt')
const pkg = require('../package')

const resources = (process.platform === 'darwin') ?
  resolve(electron, '..', '..', 'Resources') :
  resolve(electron, '..', 'resources')

const home = resolve(__dirname, '..')
const icons = join(home, 'res', 'icons')


target.link = () => {
  ln('-sf', home, join(resources, 'app'))
}

target.unlink = () => {
  rm('-f', join(resources, 'app'))
}

target.branding = (args = []) => {
  const channel = args[0] || 'dev'

  switch (process.platform) {
    case 'darwin':
      cp(join(icons, channel, `${pkg.name}.icns`),
        join(resources, 'electron.icns'))

      sed('-i', 'Electron', pkg.productName,
        join(resources, '..', 'Info.plist'))

      break
    case 'linux':
      // copy icons to hicolor
      break
  }
}

module.exports = Object.assign({}, target)
