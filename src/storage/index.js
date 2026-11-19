import { trace, warn } from '../common/log.js'
import * as schema from './migrations.js'

export class Storage {
  static schema = schema

  static load (name, ...args) {
    return new Storage(...args).load(name)
  }

  static save (name, object, ...args) {
    return new Storage(...args).save(name, object)
  }

  static migrate (name, ...args) {
    return new Storage(...args).migrate(Storage.schema[name])
  }

  constructor (namespace = 'tropy') {
    this.namespace = namespace
  }

  load (name) {
    trace({ module: 'storage', ns: this.namespace }, `restoring ${name}`)

    try {
      return JSON.parse(localStorage.getItem(this.expand(name)))
    } catch (err) {
      warn({ err, ns: this.namespace }, `failed to restore ${name}`)
      return null
    }
  }

  save (name, object) {
    if (object != null) {
      trace({ module: 'storage', ns: this.namespace }, `persisting ${name}`)
      localStorage.setItem(this.expand(name), JSON.stringify(object))
    }

    return this
  }

  remove (name) {
    localStorage.removeItem(this.expand(name))
    return this
  }

  names () {
    let suffix = `@${this.namespace}`
    let names = []

    for (let i = 0; i < localStorage.length; ++i) {
      let key = localStorage.key(i)
      if (key.endsWith(suffix))
        names.push(key.slice(0, -suffix.length))
    }

    return names
  }

  migrate ({ migrations, ignore = [] }) {
    let version = this.load('storage') ?? 0
    let last = migrations.at(-1)?.number ?? 0

    if (version >= last)
      return this

    let names = this.names().filter(name =>
      name !== 'storage' && !ignore.includes(name))

    let data = {}

    for (let name of names)
      data[name] = this.load(name)

    try {
      for (let { number, up } of migrations)
        if (number > version) data = up(data)

    } catch (err) {
      warn({ err, ns: this.namespace }, 'storage migration failed')
      data = {}
    }

    for (let name of new Set([...names, ...Object.keys(data)])) {
      if (data[name] == null)
        this.remove(name)
      else
        this.save(name, data[name])
    }

    trace({
      module: 'storage',
      ns: this.namespace
    }, `migrated from #${version} to #${last}`)

    return this.save('storage', last)
  }

  expand (name) {
    return [name, this.namespace].join('@')
  }
}
