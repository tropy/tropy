import createDatabase from '../../node_modules/better-sqlite3/lib/database.js'
import addon from '../../node_modules/better-sqlite3/build/Release/better_sqlite3.node'

export default createDatabase(() => addon, false)
