import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const ID = '\0better-sqlite3'

export default function betterSqlite3 () {
  let dir = dirname(createRequire(import.meta.url)
    .resolve('better-sqlite3/package.json'))

  return {
    name: 'better-sqlite3',

    resolveId (id) {
      if (id === 'better-sqlite3') return ID
    },

    load (id) {
      if (id === ID) return [
        `import createDatabase from ${JSON.stringify(join(dir, 'lib/database.js'))}`,
        `import addon from ${JSON.stringify(join(dir, 'build/Release/better_sqlite3.node'))}`,
        'export default createDatabase(() => addon, false)'
      ].join('\n')
    }
  }
}
