'use strict'

const { prompt } = require('../../dialog')

const uninstallPrompt = (label, options) =>
  prompt(label, {
    buttons: ['prefs.plugins.prompt.cancel', 'prefs.plugins.uninstall'],
    detail: 'prefs.plugins.prompt.message',
    ...options
  })

module.exports = {
  uninstallPrompt
}
