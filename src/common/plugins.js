'use strict'

require('./promisify')

const {
  mkdirAsync: mkdir, readFileAsync: read, writeFileAsync: write, watch
} = require('fs')

const { EventEmitter } = require('events')
const { basename, join } = require('path')
const { warn, verbose, logger } = require('./log')
const { pick } = require('./util')
const { keys } = Object
const debounce = require('lodash.debounce')

const load = async file => JSON.parse(await read(file))
const save = (file, data) => write(file, JSON.stringify(data, null, 2))

const decompress = (...args) => require('decompress')(...args)
const proxyRequire = (mod) => require(mod)


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
      require: proxyRequire
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

  create(config = this.config) {
    return config.reduce((acc, { plugin, options }, id) => {
      try {
        acc[id] = this.contract(this.require(plugin), options)
      } catch (error) {
        warn(`failed to create ${plugin} plugin: ${error.message}`)
      }
      return acc
    }, {})
  }

  async exec({ id, action }, ...args) {
    return this.instances[id][action](...args)
  }

  export(id, ...args) {
    return this.exec({ id, action: 'export' }, ...args)
  }

  handleConfigFileChange = debounce(async () => {
    await this.reloadAndScan()
    this.emit('change', { type: 'config' })
  }, 100)

  async init(autosave = true) {
    try {
      await mkdir(this.root)
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
    return this.reloadAndScan(autosave)
  }

  async install(input) {
    try {
      const plugin = Plugins.basename(input)
      await decompress(input, join(this.root, plugin), { strip: 1 })
      const spec = this.scan([{ plugin }])[0] || {}
      await this.reloadAndScan()
      this.emit('change', { type: 'plugin', plugin, spec })
      verbose(`installed plugin ${spec.name || plugin} ${spec.version}`)
    } catch (error) {
      warn(`failed to install plugin: ${error.message}`)
    }
    return this
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

  async reloadScanCreate() {
    await this.reload()
    this.spec = this.scan()
    this.instances = this.create()
    verbose(`plugins loaded: ${keys(this.instances).length}`)
    return this
  }

  async reloadAndScan(autosave = false) {
    await this.reload(autosave)
    this.spec = this.scan()
    verbose(`plugins scanned: ${keys(this.spec).length}`)
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

  save(config = this.config) {
    return save(this.configFile, config)
  }

  scan(config = this.config) {
    return config.reduce((acc, { plugin }, id) => {
      try {
        acc[id] = pick(this.require(join(plugin, 'package.json')), [
          'hooks',
          'options',
          'name',
          'version'
        ])
      } catch (error) {
        warn(`failed to scan ${plugin} plugin: ${error.message}`)
      }
      return acc
    }, {})
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
    if (this.cfw != null) this.cfw.close()
    this.cfw = watch(this.root, (_, file) => {
      if (file === 'config.json') this.handleConfigFileChange()
    })
    return this
  }

  static ext = ['tar', 'tar.bz2', 'tar.gz', 'zip']

  static basename(input) {
    return basename(input)
      .replace(/\.(tar\.(bz2|gz)|zip)$/, '')
      .replace(/-\d+(\.\d+)*$/, '')
  }
}

module.exports = {
  Plugins
}
