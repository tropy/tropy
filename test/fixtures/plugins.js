'use strict'

const { join } = require('path')

module.exports = {
  root: join(__dirname, 'plugins'),
  plugins: [
    {
      plugin: 'tropy-plugin',
      label: 'Plugin Name',
      config: {
        specific: 'to plugin'
      }
    },
    {
      plugin: 'tropy-plugin',
      label: 'Another Plugin',
      config: {}
    }
  ]
}
