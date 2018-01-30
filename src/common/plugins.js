'use strict'

const { app, nativeImage } = require('electron')
const { join } = require('path')
const { warn, verbose, logger } = require('./log')
const { uniq, pluck } = require('./util')
const { promises: jsonld } = require('jsonld')


class Plugins {
  constructor(root, config) {
    this.root = root || ARGS.home || app.getPath('userData')
    this.config = config || this.loadConfig() || []
    this.instances = []
  }

  loadConfig() {
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
    if (typeof FormData !== 'undefined') {
      // when running in the browser process
      return {
        fetch,
        FormData,
        logger,
        jsonld,
        nativeImage
      }
    } else return {}
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
        hooks,
        instanceNumber: this.instances.length
      })
    }

    const count = this.instances.length
    verbose(`Plugins(root=${this.root}, count=${count})`)
  }

  handlers(action) {
    // traverse the existing instances, and find the ones that have
    // registered a handeler for the given action
    return this.instances.reduce((res, instance) => {
      const fnNames = pluck(instance.hooks, [action])
      const { instanceNumber } = instance
      const { label } = instance.params
      if (fnNames.length) {
        const fnName = fnNames[0]
        const fn = instance.instance[fnName]
        if (typeof fn === 'function') {
          res.push({ label, fnName, instanceNumber })
        }
      }
      return res
    }, [])
  }

  getFn({ instanceNumber, fnName }) {
    const plugin = this.instances[instanceNumber].instance
    return plugin[fnName].bind(plugin)
  }
}

var instance

module.exports = {
  Plugins,

  get plugins() {
    if (!instance) {
      instance = new Plugins()
      instance.initialize()
    }
    return instance
  }
}
