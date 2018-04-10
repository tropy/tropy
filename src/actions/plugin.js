'use strict'

const { prompt } = require('../dialog')

var plugins
if (process.type !== 'browser') {
  plugins = require('../window').win.plugins
}

module.exports = {
  uninstall(payload) {
    return async function () {
      const { cancel } = await prompt.pluginUninstall(payload)
      if (cancel) return
      plugins.uninstall(payload)
    }
  }
}
