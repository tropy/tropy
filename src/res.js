import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resource, Icon, Strings } from './browser/res.js'
import ARGS from './args.js'

Object.defineProperty(Resource, 'base', {
  get() { return ARGS.app }
})

export { Resource, Icon, Strings }

export class KeyMap extends Resource {
  static get base() {
    return join(super.base, 'res/keymaps')
  }

  static open(locale, ...args) {
    return super.open(locale, process.type, ...args)
  }

  constructor(data, locale = 'en') {
    super()
    this.map = data?.[locale]?.[process.platform] || {}
    this.locale = locale
  }
}

export const Cursor = {
  get base() {
    return join(Resource.base, 'res/cursors')
  },

  expand(name) {
    return join(Cursor.base, name)
  }
}

export const Shader = {
  get base() {
    return join(Resource.base, 'res/shaders')
  },

  cache: Object.create({}),

  load(name) {
    if (!(name in Shader.cache))
      Shader.cache[name] = readFileSync(join(Shader.base, name), 'utf-8')

    return Shader.cache[name]
  }
}

export const Worker = {
  get base() {
    return join(Resource.base, 'res/workers')
  },

  expand(name) {
    return join(Worker.base, `${name}.js`)
  }
}

export const StyleSheet = {
  get base() {
    return join(Resource.base, 'lib/css')
  },

  expand(name, theme) {
    return join(StyleSheet.base, `${name}${theme ? `-${theme}` : ''}.css`)
  }
}

export const Schema = {
  get base() {
    return join(Resource.base, 'db/schema')
  },

  expand(name) {
    return join(Schema.base, `${name}.sql`)
  }
}

export const Migrations = {
  get base() {
    return join(Resource.base, 'db/migrate')
  },

  get project() {
    return Migrations.expand('project')
  },

  expand(name) {
    return join(Migrations.base, name)
  }
}
