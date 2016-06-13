'use strict'

/* eslint no-console: "off" */

const { remote } = require('electron')
const { join } = require('path')
const { readdirSync: ls } = require('fs')

const ext = function (profile) {
  switch (process.platform) {
    case 'linux':
      return join(process.env.HOME, '.config/chromium', profile, 'Extensions')

    case 'darwin':
      return join(process.env.HOME,
        'Library/Application Support/Google/Chrome', profile, 'Extensions')

    case 'win32':
      return join(process.env.LOCALAPPDATA,
        '\\Google\\Chrome\\User Data', profile, 'Extensions')
  }
}

module.export = function (profile = 'Default') {
  try {
    const ID = 'fmkadmapgofadopljbjfkapdkoienihi'
    const rd = join(ext(profile), ID)

    const version = ls(rd)[0]

    if (version) {
      console.log(remote.BrowserWindow.addDevToolsExtension(join(rd, version)))

    } else {
      console.log('React DevTools not found')
    }

  } catch (_) {
    console.log(_)
  }


  try {
    require('devtron').install()

  } catch (_) {
    // ignore
  }
}
