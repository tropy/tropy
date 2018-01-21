'use strict'

const { app } = require('electron')
const { join } = require('path')
const { warn } = require('./common/log')
const { uniq, pluck } = require('./common/util')

class Plugins {
  constructor(root = app && app.getPath('userData'), config) {
    this.root = root

    this.config = config || this._loadConfig() || []
    this.instances = []
  }

  _loadConfig() {
    // attempt to load the config file
    var cfgFile
    try {
      cfgFile = join(this.root, 'plugins.json')
      return require(cfgFile)
    } catch (error) {
      warn(`Plugin config file "${cfgFile}" not valid: ` +
           error.message)
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
      var instance
      const params = this.config[i]
      const pluginName = params.plugin
      try {
        const path = join(this.root, 'node_modules', pluginName)
        pluginPackage = require(path)
        const packageJson = require(join(path, 'package.json'))
        hooks = packageJson.hooks || {}
        instance = this.contract(pluginPackage, params.config)
      } catch (error) {
        warn(`Plugin package "${pluginName}" can not be loaded: ` +
             error.message)
      }
      instance && this.instances.push({
        pluginName,
        params,
        instance,
        hooks
      })
    }
  }

  handlers(action) {
    // traverse the existing instances, and find the ones that have
    // registered a handeler for the given action
    return this.instances.reduce((res, instance) => {
      const fnNames = pluck(instance.hooks, [action])
      if (fnNames.length) {
        const fnName = fnNames[0]
        const fn = instance.instance[fnName]
        if (typeof fn === 'function') {
          const { label } = instance.params
          res.push({ label, fn })
        }
      }
      return res
    }, [])
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
