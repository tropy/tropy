'use strict'

const { app } = require('electron')
const { join } = require('path')
const { uniq } = require('./common/util')
// const { warn } = require('./common/log')

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

  get context() {
    return {
      FormData: window.FormData,
      fetch: window.fetch
    }
  }

  contract(Plugin, config) {
    return new Plugin(config, this.context)
  }

  get packages() {
    return uniq(this.config.map(p => p.plugin))
  }

  initialize() {
    // for each instance in `this.config`, require their package
    // and store it in `this.instances`
    for (let i = 0; i < this.config.length; i++) {
      var pluginPackage
      var hooks
      const params = this.config[i]
      const pluginName = params.plugin
      try {
        const path = join(this.root, 'node_modules', pluginName)
        pluginPackage = require(path)
        const packageJson = require(join(path, 'package.json'))
        hooks = packageJson.hooks || {}
      } catch (err) {
        throw Error(`Plugin package "${pluginName}" can not be loaded`)
      }
      this.instances.push({
        plugin: pluginName,
        params,
        instance: this.contract(pluginPackage, params.config),
        hooks
      })
    }
  }
}

var instance

module.exports = {
  Plugins,

  get plugins() {
    if (!instance) instance = new Plugins()
    return instance
  }
}
