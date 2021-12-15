import { EventEmitter } from 'events'
import fs from 'fs'
import { basename, join } from 'path'
import { shell } from 'electron'
import debounce from 'lodash.debounce'
import { logger, info, warn } from './log'
import { blank, get, omit, uniq } from './util'
import { unzip } from './zip'

const {
  mkdir,
  readFile: read,
  writeFile: write,
  readdir,
  stat
} = fs.promises

const load = async file => JSON.parse(await read(file))
const save = (file, data) => write(file, JSON.stringify(data, null, 2))

const subdirs = async root => (
  (await readdir(root, { withFileTypes: true }))
    .reduce((acc, d) => {
      if (d.name !== 'node_modules' && d.isDirectory())
        acc.push(d.name)
      return acc
    }, []))


export class Plugins extends EventEmitter {
  constructor(root, context = {}) {
    super()
    this.context = context
    this.root = root
    this.reset()
  }

  get configFile() {
    return join(this.root, 'config.json')
  }

  getContext(plugin) {
    return {
      logger: logger.child({ plugin }),
      require(mod) {
        warn(`plugin ${plugin} requires ${mod} via context: update required!`)
        return require(mod)
      },
      ...this.context
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

  // Subtle: CommonJS is still used natively. We need to address
  // this if we switch to ESM!
  clearModuleCache(root = this.root) {
    for (let mod in require.cache) {
      if (mod.startsWith(root)) delete require.cache[mod]
    }
  }

  async create(config = this.config) {
    this.instances = {}
    let loadcount = 0

    for (let i = 0; i < config.length; ++i) {
      let { plugin, options, name } = config[i]

      try {
        let Plugin = await this.import(plugin)

        if (typeof Plugin !== 'function')
          Plugin = Plugin.default

        this.instances[i] = new Plugin(
          options ?? {},
          this.getContext(plugin)
        )

        loadcount++

      } catch (e) {
        warn({ stack: e.stack }, `failed to create plugin ${plugin} "${name}"`)
        console.log(e.stack)
      }
    }

    info(`plugins loaded: ${loadcount}`)
    this.emit('change')
    return this
  }

  async exec({ id, action }, ...args) {
    return this.instances[id][action](...args)
  }

  export = (id, ...args) => {
    return this.exec({ id, action: 'export' }, ...args)
  }

  import = (id, ...args) => {
    return this.exec({ id, action: 'import' }, ...args)
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
    await mkdir(this.root, { recursive: true })
    return this.reload(autosave)
  }

  async install(input) {
    try {
      var plugin = Plugins.basename(input)
      let dest = join(this.root, plugin)
      await this.uninstall(plugin, { prune: false })
      await unzip(input, dest, { strip: true })
      var spec = (await this.scan([plugin]))[plugin] || {}
      await this.reload()
      this.emit('change')
      info(`installed plugin ${spec.name || plugin} ${spec.version}`)
    } catch (e) {
      warn({
        stack: e.stack
      }, `failed to install plugin ${spec?.name || plugin}`)
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
    } catch (e) {
      if (e.code !== 'ENOENT') {
        warn({ stack: e.stack }, 'failed to load plugin config')
      } else {
        if (autosave) await this.save()
      }
    }
    this.spec = await this.scan()
    info(`plugins scanned: ${Object.keys(this.spec).length}`)
    return this
  }

  async import(name) {
    let res

    try {
      let mod = join(this.root, name)

      res = require(mod)
      res.source = 'local'

    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND')
        throw e

      let mod = join(this.root, 'node_modules', name)
      res = require(mod)
      res.source = 'npm'
    }

    return res
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
    if (!plugins) plugins = await this.list()

    let spec = {}

    for (let name of plugins) {
      try {
        let pkg = await this.import(join(name, 'package.json'))

        spec[name] = {
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
      } catch (e) {
        warn({ stack: e.stack }, `failed to scan '${name}' plugin`)
      }
    }

    return spec
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
      await shell.trashItem(dir)

      this.clearModuleCache(dir)
      if (prune) {
        this.config = this.config.filter(c => c.plugin !== plugin)
        this.spec = omit(this.spec, [plugin])
        this.save()
        this.emit('change')
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        warn({ stack: e.stack }, 'failed to uninstall plugin "${plugin}"')
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
