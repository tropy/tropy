import assert from 'node:assert'
import { access, stat, mkdir } from 'node:fs/promises'
import {
  basename, dirname, extname, join, normalize, resolve, relative
} from 'node:path'
import { v4 as uuid } from 'uuid'
import { Database } from './db.js'
import { home } from './os.js'
import { into, select, update } from './query.js'
import { version } from './release.js'
import { empty } from './util.js'


/*
 * Creates a new Tropy project.
 */
export async function create(path, schema, {
  autoclose = true,
  name = 'Tropy',
  base = null,
  id = uuid()
} = {}) {
  try {
    let type = getProjectType(path)
    let dbFile = path
    let store = null

    if (type === TPM) {
      dbFile = join(path, TPM_DB_NAME)
      store = TPM_STORE_NAME
      base = 'project'

      await mkdir(path)
      await mkdir(join(path, store))

    } else {
      assert(await access(dbFile).then(() => false, () => true),
        `project file exists: "${dbFile}"`)

      assert([null, 'project', 'home'].includes(base),
        `project base not supported: "${base}"`)
    }

    var db = new Database(dbFile, 'w+', { max: 1 })

    await db.read(schema)
    await db.run(...into('project').insert({
      project_id: id,
      name,
      base,
      store
    }))

    if (type === TPM) {
      db.exec('PRAGMA journal_mode = WAL;')
    }

    if (autoclose) {
      await db.close()
      db = null
    }

    return db


  } catch (e) {
    await db?.close()
    throw e
  }
}


/*
 * Opens a project file and returns an array with an `info` object
 * and a live `db` instance.
 *
 * Unless for read-only project files, any outstanding migrations
 * in the `migrate` folder will be applied.
 *
 * If there are no migrations,
 * an integrity check will be performed instead.
 *
 * Additionally, the following database event handlers are attached:
 * - After the first write (or immediately after migrations)
 *   an access row will be created using the given `user` id.
 *
 * - Before closing the database, the access record will be finalized
 *   and the access table pruned.
 *
 */
export async function open(path, {
  migrate,
  pruneAccessTable = false,
  skipIntegrityCheck = false,
  user,
  ...dbOptions
}) {
  let type = getProjectType(path)
  let dbFile = (type === TPM) ? join(path, TPM_DB_NAME) : path

  let db = await Database.open(dbFile, dbOptions)

  if (migrate && !db.isReadOnly) {
    var migrations = await db.migrate(migrate)
  }

  let info = await load(db)
  let accessId

  if (migrations?.length > 0) {
    accessId = await beginProjectAccess(db, user)

  } else {
    db.once('update', async () => {
      accessId = await beginProjectAccess(db, user)
    })

    if (!skipIntegrityCheck) {
      await db.check().catch(() => {
        info.isCorrupted = true
      })
    }
  }

  db.once('will-close', async () => {
    if (accessId)
      await endProjectAccess(db, accessId, pruneAccessTable)
  })

  return [db, info]
}

/*
 * Returns stats for a Tropy project file.
 */
export async function pstat(path, modifiedSince) {
  try {
    let type = getProjectType(path)
    let dbFile

    if (type === TPM) {
      dbFile = join(path, TPM_DB_NAME)

    } else {
      dbFile = path

      if (isManaged(dbFile)) {
        type = TPM
        path = dirname(dbFile)
      }
    }

    let { mtimeMs } = await stat(dbFile)

    if (modifiedSince > mtimeMs)
      return null

    var db = new Database(dbFile, 'r', { max: 1 })
    let stats = await db.get(projectStats.query)

    stats.path = path
    stats.lastModified = mtimeMs

    return stats

  } finally {
    await db?.close()
  }
}


export async function load(db) {
  let info = await db.get(projectInfo.query)
  assert(info?.id != null, 'invalid project info')

  info.isReadOnly = db.isReadOnly
  info.basePath = resolveBasePath(db, info.base)

  let isManaged = info.store != null

  if (isManaged) {
    info.store = resolve(info.basePath, normalize(info.store))
    info.path = dirname(db.path)

  } else {
    info.path = db.path
  }

  return info
}

export async function save(db, { id, ...props }, basePath) {
  if (basePath && props.store)
    props.store = relative(basePath, props.store)

  if (!empty(props))
    return db.run(
      ...update('project').set(props).where({ project_id: id })
    )
}

export async function optimize(db) {
  await db.exec("INSERT INTO fts_notes(fts_notes) VALUES ('optimize')")
  await db.exec("INSERT INTO fts_metadata(fts_metadata) VALUES ('optimize')")
  await db.exec('VACUUM')
}

export async function reindex(db) {
  await db.check()
  await db.exec('REINDEX')
  await db.exec("INSERT INTO fts_notes(fts_notes) VALUES ('rebuild')")
  await db.exec("INSERT INTO fts_metadata(fts_metadata) VALUES ('rebuild')")
}


export function resolveBasePath(db, base) {
  switch (base) {
    case 'project':
      return dirname(db.path)
    case 'home':
      return home
    default:
      return base
  }
}

export function getProjectType(path) {
  switch (extname(path).toLowerCase()) {
    case '.tpy':
      return TPY
    case '.tpm':
      return TPM
    default:
      throw new Error(`unknown project file extension ${path}`)
  }
}

const isManaged = (path) =>
  basename(path) === TPM_DB_NAME &&
    extname(dirname(path)).toLowerCase() === '.tpm'

export const TPY = 'tpy'
export const TPM = 'tpm'

const TPM_DB_NAME = 'project.tpy'
const TPM_STORE_NAME = 'assets'

const projectInfo =
  select({ id: 'project_id' }, 'name', 'base', 'store', {
    lastAccess:
      select('opened')
        .from('access')
        .order('opened desc')
        .limit(1)
  }).from('project').limit(1)

const projectStats =
  select({ id: 'project_id' }, 'name', {
    items:
      select('count(id)')
        .from('items')
        .outer.join('trash', { using: 'id' }),
    photos:
      select('count(id)')
        .from('photos')
        .outer.join('trash', { using: 'id' }),
    notes: select('count(note_id)').from('notes')

  }).from('project').limit(1)


export async function beginProjectAccess(db, user) {
  if (user == null)
    return null

  let { id } = await db.run(
    ...into('access')
      .insert({
        path: db.path,
        uuid: user,
        version
      }))

  return id
}

export async function endProjectAccess(db, id, prune = false) {
  await db.run(
    ...update('access')
      .set('closed = datetime("now")')
      .where({ rowid: id }))

  if (prune) {
    await db.run(`
      DELETE FROM access
        WHERE rowid <= (
          SELECT rowid FROM (
            SELECT rowid FROM access ORDER BY rowid DESC LIMIT 1 OFFSET 99
          )
        )`
    )
  }
}
