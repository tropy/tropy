'use strict'

const { prompt } = require('../dialog')

module.exports = {
  uninstall(plugins, plugin) {
    return async function () {
      const { cancel } = await prompt.pluginUninstall(plugin)
      if (cancel) return
      plugins.uninstall(plugin)
    }
  }
}
