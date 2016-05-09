'use strict'

require('shelljs/make')

const { info } = require('./log')
const { join, resolve, extname, basename } = require('path')
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
  const tag = 'branding'
  const channel = args[0] || 'dev'

  switch (process.platform) {
    case 'darwin':
      cp(join(icons, channel, `${pkg.name}.icns`),
        join(resources, 'electron.icns'))

      sed('-i', 'Electron', pkg.productName,
        join(resources, '..', 'Info.plist'))

      info(`applied ${channel} branding to ${electron}`, { tag })
      break
    case 'linux': {
      let source = join(icons, channel, pkg.name)
      let theme = join(process.env.HOME, '.local', 'share', 'icons', 'hicolor')
      let name = (channel === 'stable') ?
        pkg.name : [pkg.name, channel].join('-')

      for (let icon of ls(source)) {
        let ext = extname(icon)
        let variant = basename(icon, ext)
        let target = join(theme, variant, 'apps')

        mkdir('-p', target)
        cp(join(source, icon), join(target, `${name}${ext}`))
      }

      info(`copied icons to ${theme}`, { tag })

      let target = join(process.env.HOME, '.local', 'share', 'applications')

      mkdir('-p', target)
      desktop(electron, name)
        .to(join(target, `${pkg.name}-${channel}.desktop`))

      info(`desktop file written to ${target}`, { tag })

      break
    }
  }
}

function desktop(exec, icon, name = pkg.productName, path = home) {
  return `#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=${name}
Exec=${exec} ${path}
Icon=${icon}
Path=${path}
StartupWMClass=${pkg.name}`
}

module.exports = Object.assign({}, target)
