'use strict'

const { prompt } = require('../../dialog')

const uninstallPrompt = (label, options) =>
  prompt(label, {
    buttons: ['prefs.plugins.uninstall', 'prefs.plugins.prompt.cancel'],
    defaultId: 1,
    cancelId: 1,
    detail: 'prefs.plugins.prompt.message',
    type: 'warning',
    ...options
  })

module.exports = {
  uninstallPrompt
}
