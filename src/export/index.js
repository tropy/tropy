'use strict'

const { plugins } = require('../plugins')

module.exports = {
  ...require('./export'),

  buildExportMenu: (item, params, responder) => {
    const { target } = params[0]
    item.submenu = [
      ...item.submenu,
      ...plugins.map(plugin => ({
        label: plugin.label,
        click: responder('app:export-item', { target, plugin })
      }))
    ]
    return item
  }
}
