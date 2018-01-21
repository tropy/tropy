'use strict'

const { app } = require('electron')
const { join } = require('path')
const { uniq } = require('./common/util')
// const { warn } = require('./common/log')

const context = {
  FormData,
  fetch
}

class Plugins {
  constructor(root = app.getPath('userData'), config) {
    this.root = root

    this.config = config || this._loadConfig()
    this.instances = []
  }

  _loadConfig() {
    // attempt to load the config file
    const cfgFile = join(this.root, 'plugins.json')
    try {
      return require(cfgFile)
    } catch (err) {
      throw Error(`Plugin config file "${cfgFile}" not valid`)
    }
  }

  contract(Plugin, config) {
    return new Plugin(config, context)
  }

  get packages() {
    return uniq(this.config.map(p => p.plugin))
  }

  initialize() {
    // for each instance in `this.config`, require their package
    // and store it in `this.instances`
    for (let i = 0; i < this.config.length; i++) {
      var pluginPackage
      const params = this.config[i]
      const pluginName = params.plugin
      try {
        const path = join(this.root, 'node_modules', pluginName)
        pluginPackage = require(path)
      } catch (err) {
        throw Error(`Plugin package "${pluginName}" can not be loaded`)
      }
      this.instances.push({
        plugin: pluginName,
        params,
        instance: this.contract(pluginPackage, params.config)
      })
    }
  }
}

module.exports = Plugins
