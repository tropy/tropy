import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const ID = '\0better-sqlite3'
const ADDON = 'node/lib/better_sqlite3.node'

// Bundles better-sqlite3 with our own build of its addon,
// which is emitted to ADDON next to the output file.
export default function betterSqlite3 () {
  let dir = dirname(createRequire(import.meta.url)
    .resolve('better-sqlite3/package.json'))

  return {
    name: 'better-sqlite3',

    resolveId (id) {
      if (id === 'better-sqlite3') return ID
    },

    load (id) {
      if (id !== ID) return

      this.emitFile({
        type: 'asset',
        fileName: ADDON,
        source: readFileSync(join(dir, 'build/Release/better_sqlite3.node'))
      })

      return [
        `import createDatabase from ${JSON.stringify(join(dir, 'lib/database.js'))}`,
        `const addon = require('./${ADDON}')`,
        'export default createDatabase(() => addon, false)'
      ].join('\n')
    }
  }
}
