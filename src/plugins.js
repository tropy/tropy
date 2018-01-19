'use strict'

const { app } = require('electron')
const { join } = require('path')
const { uniq } = require('./common/util')


class Plugins {
  constructor(root = app.getPath('userData')) {
    this.root = root
    this._loadConfig()
  }

  _loadConfig() {
    // attempt to load the config file
    const cfgFile = join(this.root, 'plugins.json')
    try {
      this.config = require(cfgFile)
    } catch (err) {
      throw Error(`Plugin config file "${cfgFile}" not valid`)
    }
  }

  get packages() {
    return uniq(this.config.map(p => p.plugin))
  }
}

module.exports = Plugins
