'use strict'

const { prompt } = require('../dialog')

module.exports = {
  uninstall({ plugins, name }, meta = { prompt: true }) {
    return async function () {
      if (meta.prompt) {
        const { cancel } = await prompt.pluginUninstall(name)
        if (cancel) return
      }
      plugins.uninstall(name)
    }
  }
}
