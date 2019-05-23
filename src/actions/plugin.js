'use strict'

const { prompt } = require('../dialog')

module.exports = {
  uninstall({ plugins, name }, meta = {}) {
    return async () => {
      if (meta.prompt !== false) {
        if ((await prompt('plugin.uninstall', { message: name })).cancel)
          return null
      }

      await plugins.uninstall(name)
    }
  }
}
