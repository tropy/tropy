'use strict'

const { app, nativeImage } = require('electron')
const { join } = require('path')
const { warn, verbose, logger } = require('./log')
const { uniq, pluck } = require('./util')
const { promises: jsonld } = require('jsonld')

class Plugins {
  constructor(root, plugins = []) {
    this.root = root
    this.plugins = plugins
    this.instances = []
    this.loadPaths = [
      join(this.root, 'node_modules'),
      this.root
    ]
  }

  get context() {
    return {
      logger,
      jsonld,
      nativeImage
    }
  }

  contract(Plugin, config) {
    return new Plugin(config, this.context)
  }

  get packages() {
    return uniq(this.plugins.map(p => p.package))
  }

  // try to load the package from one of the paths
  loadPackage(name) {
    let pkg, hooks
    for (let i = 0; i < this.loadPaths.length; i++) {
      const path = join(this.loadPaths[i], name)
      try {
        pkg = require(path)
        hooks = require(join(path, 'package.json')).hooks || {}
      } catch (error) {
        continue
      }
      if (pkg) return { pkg, hooks }
    }
    warn(`Plugin package "${name}" can not be loaded`)
  }

  initialize() {
    // for each instance in `this.plugins`, require their package
    // and store it in `this.instances`
    for (let i = 0; i < this.plugins.length; i++) {
      const params = this.plugins[i]

      const result = this.loadPackage(params.package)
      if (result) {
        const { pkg, hooks } = result
        const instance = this.contract(pkg, params.config)

        instance && this.instances.push({
          params,
          instance,
          hooks,
          instanceNumber: this.instances.length
        })
      }

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
      const home = ARGS.home || app.getPath('userData')
      let config
      try {
        config = require(join(home, 'plugins.json'))
      } catch (e) {
        config = []
      }
      instance = new Plugins(join(home, 'plugins'), config)
      instance.initialize()
    }
    return instance
  }
}
