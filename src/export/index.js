'use strict'

const { plugins } = require('../plugins')

const handlers = plugins.handlers('export')

module.exports = {
  ...require('./export'),

  buildExportMenu: (item, params, responder) => {
    const { target } = params[0]
    item.submenu = [
      ...item.submenu,
      ...handlers.map(handler => ({
        label: handler.label,
        click: responder('app:export-item', {
          target,
          plugin: handler.fn
        })
      }))
    ]
    return item
  }
}
