import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const appDir = join(import.meta.dirname, '../..')
const fixtures = join(appDir, 'test/fixtures')

globalThis.F = {
  appDir,
  dir: fixtures,

  get state() {
    return require(join(fixtures, 'state', 'index.js'))
  },

  image: {
    path(name) {
      return join(fixtures, 'images', name)
    },
    url(name) {
      return pathToFileURL(join(fixtures, 'images', name))
    }
  },

  join(...args) {
    return join(fixtures, ...args)
  },

  require(name) {
    return require(join(fixtures, `${name}.js`))
  },

  schema(name = 'project') {
    return join(appDir, 'db', 'schema', `${name}.sql`)
  }
}
