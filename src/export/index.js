'use strict'

const plugins = [
  {
    label: 'Omeka',
    target: 'omeka'
  }
]

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
