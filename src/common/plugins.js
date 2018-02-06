'use strict'

require('./promisify')

const {
  mkdirAsync: mkdir, readFileAsync: read, writeFileAsync: write
} = require('fs')

const { EventEmitter } = require('events')
const { join } = require('path')
const { warn, verbose, logger } = require('./log')
const { pick } = require('./util')
const { keys } = Object

const load = async file => JSON.parse(await read(file))
const save = (file, data) => write(file, JSON.stringify(data))


class Plugins extends EventEmitter {
  constructor(root) {
    super()
    this.root = root
    this.reset()
  }

  get configFile() {
    return join(this.root, 'config.json')
  }

  get context() {
    return {
      logger
    }
  }

  available(action) {
    const handlers = []
    for (const id in this.spec) {
      const { hooks, name } = this.spec[id]
      if (hooks[action]) {
        handlers.push({
          id,
          name: this.config[id].name || `${name} #${id}`
        })
      }
    }
    return handlers
  }

  contract(Plugin, options) {
    return new Plugin(options || {}, this.context)
  }

  create() {
    this.instances = this.config.reduce((acc, { plugin, options }, id) => {
      try {
        acc[id] = this.contract(this.require(plugin), options)
      } catch (error) {
        warn(`failed to create ${plugin} plugin`, { error })
      }
      return acc
    }, {})
    verbose(`plugins created: ${keys(this.instances).length}`)
    return this
  }

  async exec({ id, action }, ...args) {
    return this.instances[id][action](...args)
  }

  export(id, ...args) {
    return this.exec({ id, action: 'export' }, ...args)
  }

  async init() {
    try {
      await mkdir(this.root)
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
    return this.reload(true)
  }

  async reload(autosave = false) {
    try {
      this.reset()
      this.config = await load(this.configFile)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      if (autosave) await this.save()
    }
    this.emit('did-update')
    return this
  }

  require(name, fallback = 'node_modules') {
    try {
      return require(join(this.root, name))
    } catch (error) {
      if (!fallback || error.code !== 'MODULE_NOT_FOUND') throw error
      return this.require(join(fallback, name), false)
    }
  }

  reset() {
    this.config = []
    this.spec = {}
    this.instances = {}
  }

  save() {
    return save(this.configFile, this.config)
  }

  scan() {
    this.spec = this.config.reduce((acc, { plugin }, id) => {
      try {
        acc[id] = pick(this.require(join(plugin, 'package.json')), [
          'hooks',
          'name',
          'version'
        ])
      } catch (error) {
        warn(`failed to scan ${plugin} plugin`, { error })
      }
      return acc
    }, {})
    verbose(`plugins scanned: ${keys(this.spec).length}`)
    return this
  }

  stop() {
    this.removeAllListeners()
    return this
  }

  watch() {
    return this
  }
}

module.exports = {
  Plugins
}
