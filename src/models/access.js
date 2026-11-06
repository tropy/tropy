import { isAbsolute, join, relative } from 'node:path'
import { home } from '../common/os.js'
import { version } from '../common/release.js'
import sql from '../common/sql.js'

export async function open (db, user) {
  if (user == null)
    return null

  // NB: hide user name in access log
  let path = relative(home, db.path)

  if (path.startsWith('..') || isAbsolute(path))
    path = db.path
  else
    path = join('~', path)

  let { id } = await db.run(sql`
    INSERT INTO access (path, uuid, version)
      VALUES (${path}, ${user}, ${version})`)

  return id
}

export async function close (db, id, { prune = false } = {}) {
  if (id == null)
    return

  await db.run(sql`
    UPDATE access SET closed = datetime('now') WHERE rowid = ${id}`)

  if (prune) {
    await db.run(sql`
      DELETE FROM access
        WHERE rowid <= (
        SELECT rowid FROM (
          SELECT rowid FROM access ORDER BY rowid DESC LIMIT 1 OFFSET 100
        )
      )`)
  }
}
