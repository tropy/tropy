'use strict'

require('./promisify')

const {
  mkdirAsync: mkdir, readFileAsync: read, writeFileAsync: write, watch
} = require('fs')
const { resolve } = require('path')

const { EventEmitter } = require('events')
const { join } = require('path')
const { warn, verbose, logger } = require('./log')
const { pick } = require('./util')
const { keys } = Object
const debounce = require('lodash.debounce')

const load = async file => JSON.parse(await read(file))
const save = (file, data) => write(file, JSON.stringify(data))
const tropyRequire = (name) => {
  let paths = [
    name,
    resolve('node_modules', name),
    resolve('../node_modules', name),
    resolve(__dirname, '../../electron/node_modules', name),
    resolve(__dirname, '../../electron.asar/node_modules', name),
    resolve(__dirname, '../../app/node_modules', name),
    resolve(__dirname, '../../app.asar/node_modules', name),
  ]
  for (let path of paths) {
    let pkg
    try {
      pkg = require(path)
    } catch (err) { continue }
    return pkg
  }
  throw new Error(`Could not require package ${name}`)
}

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
      logger,
      require: tropyRequire
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
        warn(`failed to create ${plugin} plugin: ${error.message}`)
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

  handleConfigFileChange = debounce(async () => {
    await this.reload()
    this.scan()
    this.emit('config-change')
  }, 100)

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
      if (error.code !== 'ENOENT') {
        warn(`failed to load plugin config: ${error.message}`)
      } else {
        if (autosave) await this.save()
      }
    }
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
        warn(`failed to scan ${plugin} plugin: ${error.message}`)
      }
      return acc
    }, {})
    verbose(`plugins scanned: ${keys(this.spec).length}`)
    return this
  }

  stop() {
    this.removeAllListeners()
    if (this.cfw != null) {
      this.cfw.close()
      this.cfw = null
    }
    return this
  }

  watch() {
    this.cfw = watch(this.configFile, this.handleConfigFileChange)
    return this
  }
}

module.exports = {
  Plugins
}
