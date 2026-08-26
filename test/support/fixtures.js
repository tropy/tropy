import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Document } from 'alto-xml'

const require = createRequire(import.meta.url)
const appDir = join(import.meta.dirname, '../..')
const fixtures = join(appDir, 'test/fixtures')

globalThis.F = {
  appDir,
  dir: fixtures,

  alto (name) {
    return Document.parse(
      readFileSync(join(fixtures, 'alto', `${name}.xml`), 'utf-8'))
  },

  get state () {
    return require(join(fixtures, 'state', 'index.js'))
  },

  image: {
    path (name) {
      return join(fixtures, 'images', name)
    },
    url (name) {
      return pathToFileURL(join(fixtures, 'images', name))
    }
  },

  join (...args) {
    return join(fixtures, ...args)
  },

  require (name) {
    return require(join(fixtures, `${name}.js`))
  },

  schema (name = 'project') {
    return join(appDir, 'db', 'schema', `${name}.sql`)
  }
}
