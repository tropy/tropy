'use strict'

const dialog = require('../dialog')

module.exports = {
  uninstall({ plugins, name }, { prompt = true } = {}) {
    return async function () {
      if (!(prompt && (await dialog.prompt.plugin.uninstall(name)).cancel)) {
        await plugins.uninstall(name)
      }
    }
  }
}
