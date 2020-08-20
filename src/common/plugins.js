'use strict'

const fs = require('fs')

const {
  mkdir,
  readFile: read,
  writeFile: write,
  readdir,
  stat
} = fs.promises


const { shell } = require('electron')
const { EventEmitter } = require('events')
const { basename, join } = require('path')
const { info, warn } = require('./log')
const { blank, get, omit, uniq } = require('./util')
const { unzip } = require('./zip')
const debounce = require('lodash.debounce')

const load = async file => JSON.parse(await read(file))
const save = (file, data) => write(file, JSON.stringify(data, null, 2))

const proxyRequire = (mod) => require(mod)

const subdirs = async root => (
  (await readdir(root, { withFileTypes: true }))
    .reduce((acc, d) => {
      if (d.name !== 'node_modules' && d.isDirectory())
        acc.push(d.name)
      return acc
    }, []))


class Plugins extends EventEmitter {
  constructor(root) {
    super()
    this.root = root
    this.reset()
  }

  get configFile() {
    return join(this.root, 'config.json')
  }

  getContext(plugin) {
    return {
      logger: require('./log').logger.child({ plugin }),
      require: proxyRequire
    }
  }

  available(action) {
    return this.config.reduce((acc, { plugin, name, disabled }, id) => {
      if (!disabled && this.supports(plugin, action)) {
        acc.push({ id: `${id}`, name: name || `${plugin} #${id}` })
      }
      return acc
    }, [])
  }

  clearModuleCache(root = this.root) {
    for (let mod in require.cache) {
      if (mod.startsWith(root)) delete require.cache[mod]
    }
  }

  create(config = this.config) {
    this.instances = config.reduce((acc, { plugin, options, name }, id) => {
      try {
        acc[id] = new (this.require(plugin))(
          options || {},
          this.getContext(plugin))
      } catch (e) {
        warn({ stack: e.stack }, `failed to create plugin ${plugin} "${name}"`)
      }
      return acc
    }, {})
    info(`plugins loaded: ${Object.keys(this.instances).length}`)
    return this
  }

  async exec({ id, action }, ...args) {
    return this.instances[id][action](...args)
  }

  export(id, ...args) {
    return this.exec({ id, action: 'export' }, ...args)
  }

  flush = async () => {
    if (this.changes != null) { // TODO check if the config is different!
      await this.save(this.changes)
      this.changes = null
    }
  }

  handleConfigFileChange = debounce(async () => {
    await this.reload()
    this.emit('change')
  }, 100)

  async init(autosave = true) {
    try {
      await mkdir(this.root)
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
    return this.reload(autosave)
  }

  async install(input) {
    try {
      const plugin = Plugins.basename(input)
      const dest = join(this.root, plugin)
      await this.uninstall(plugin, { prune: false })
      await unzip(input, dest)
      const spec = (await this.scan([plugin]))[plugin] || {}
      await this.reload()
      this.emit('change')
      info(`installed plugin ${spec.name || plugin} ${spec.version}`)
    } catch (error) {
      warn(`failed to install plugin: ${error.message}`)
    }
    return this
  }

  async list() {
    try {
      return uniq([
        ...(await deps(join(this.root, 'package.json'))),
        ...(await subdirs(this.root))
      ])
    } catch (error) {
      warn(`failed to list plugins: ${error.message}`)
      return []
    }
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
    this.spec = await this.scan()
    info(`plugins scanned: ${Object.keys(this.spec).length}`)
    return this
  }

  require(name, fallback = 'node_modules') {
    let pkg
    try {
      pkg = require(join(this.root, name))
      pkg.source = 'local'
    } catch (error) {
      if (!fallback || error.code !== 'MODULE_NOT_FOUND') throw error
      pkg = this.require(join(fallback, name), false)
      pkg.source = 'npm'
    }
    return pkg
  }

  reset() {
    this.changes = null
    this.config = []
    this.spec = {}
    this.instances = {}
  }

  save(config = this.config) {
    return save(this.configFile, config)
  }

  async scan(plugins) {
    return (plugins || await this.list()).reduce((acc, name) => {
      try {
        let pkg = this.require(join(name, 'package.json'))
        acc[name] = {
          name,
          description: pkg.description,
          version: pkg.version,
          options: pkg.options,
          label: pkg.label || pkg.productName,
          hooks: pkg.hooks || {},
          source: pkg.source,
          repository: pkg.repository,
          homepage: homepage(pkg)
        }
      } catch (error) {
        warn(`failed to scan '${name}' plugin: ${error.message}`)
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

  store(config) {
    this.changes = config
  }

  supports(plugin, action) {
    return !!get(this.spec, [plugin, 'hooks', action])
  }

  async uninstall(plugin, { prune = true } = {}) {
    try {
      const dir = join(this.root, plugin)
      if (!((await stat(dir)).isDirectory())) {
        throw new Error('not a plugin directory')
      }
      if (!shell.moveItemToTrash(dir)) {
        throw new Error('failed to move directory to trash')
      }
      this.clearModuleCache(dir)
      if (prune) {
        this.config = this.config.filter(c => c.plugin !== plugin)
        this.spec = omit(this.spec, [plugin])
        this.save()
        this.emit('change')
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        warn(`failed to uninstall plugin "${plugin}": ${error.message}`)
      }
    }
    return this
  }

  watch() {
    if (this.cfw != null) this.cfw.close()
    this.cfw = fs.watch(this.root, (_, file) => {
      if (file === 'config.json') this.handleConfigFileChange()
    })
    return this
  }

  static ext = ['zip']

  static basename(input) {
    return basename(input)
      .replace(/\.(zip)$/, '')
      .replace(/-\d+(\.\d+)*$/, '')
  }
}

const deps = async pkg => {
  try {
    return Object.keys((await load(pkg)).dependencies)
  } catch (_) {
    return []
  }
}

const homepage = pkg => {
  if (!blank(pkg.homepage)) return pkg.homepage
  if (blank(pkg.repository)) return null
  if (pkg.repository.url) return pkg.repository.url
  if (typeof pkg.repository !== 'string') return null
  if (pkg.repository.startsWith('http')) return pkg.repository
  return pkg.repository
      .replace(/^github:/, 'https://github.com/')
      .replace(/^gitlab:/, 'https://gitlab.com/')
      .replace(/^bitbucket:/, 'https://bitbucket.org/')
}

module.exports = {
  Plugins
}
