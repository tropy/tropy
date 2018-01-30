'use strict'

const { plugins } = require('../common/plugins')

const handlers = plugins.handlers('export')

module.exports = {
  ...require('./export'),

  buildExportMenu: (item, params, responder) => {
    const { target } = params[0]
    item.submenu = [
      ...item.submenu,
      ...handlers.map(plugin => ({
        label: plugin.label,
        click: responder('app:export-item', {
          target,
          plugin
        })
      }))
    ]
    return item
  }
}
