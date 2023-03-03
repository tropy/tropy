import { shell } from 'electron'
import assert from 'node:assert'
import { existsSync } from 'node:fs'
import { chmod, cp, stat, mkdir } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve, relative } from 'node:path'
import { v4 as uuid } from 'uuid'
import { Database } from './db.js'
import { home, normalize } from './os.js'
import { into, select, update } from './query.js'
import { version } from './release.js'
import { empty, pMap } from './util.js'
import { info, warn } from './log.js'

import { Asset } from '../asset/asset.js'
import { Store } from '../asset/store.js'


/*
 * Creates a new Tropy project.
 */
export async function create(path, schema, {
  autoclose = true,
  name = 'Tropy',
  base = null,
  id = uuid(),
  overwrite = false
} = {}) {
  try {
    let type = getProjectType(path)
    let dbFile = path
    let store = null

    await checkProjectPath(path, overwrite)
    info(`creating new project at "${path}"`)

    if (type === MANAGED) {
      dbFile = join(path, MANAGED_DB_NAME)
      store = MANAGED_STORE_NAME
      base = BASE.PROJECT

      await makeProjectDir(path, store)

    } else {
      assert(BASES.includes(base),
        `project base not supported: "${base}"`)
    }

    var db = new Database(dbFile, 'w+', {
      max: 1,
      journalMode: type === MANAGED ? 'wal' : 'delete'
    })

    await db.read(schema)
    await db.run(...into('project').insert({
      project_id: id,
      name,
      base,
      store
    }))

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

// Ensures that a project path is available
async function checkProjectPath(path, overwrite = false) {
  if (existsSync(path)) {
    if (!overwrite)
      throw new Error(`project file exists: "${path}"`)

    warn(`trashing old project previously at "${path}"`)
    await shell.trashItem(path)
  }
}

// Creates the folder structure for managed projects.
async function makeProjectDir(path, store) {
  await mkdir(path)
  await mkdir(join(path, store))
}


/*
 * Converts `.tpy` files to managed `.tropy` projects.
 *
 * Returns a list of asset URLs which were not added to the store.
 *
 * If the return value is empty,
 * all assets were successfully added.
 * Otherwise, the conversion was not complete,
 * which typically means the project needs consolidation.
 *
 * Any errors unrelated to adding files to the store,
 * such as failure to write to the database file,
 * will be thrown.
 */
export async function convert(src, path, {
  concurrency = 4,
  overwrite = false
} = {}) {
  try {
    let type = getProjectType(path)

    assert(type !== getProjectType(src),
      'different types expected for conversion')

    if (type !== MANAGED)
      throw new Error(`conversion to "${type}" not implemented`)

    await checkProjectPath(path, overwrite)
    info(`converting project "${src}" to "${path}"`)

    let dbFile = join(path, MANAGED_DB_NAME)
    let store = new Store(join(path, MANAGED_STORE_NAME))
    let errors = []

    await makeProjectDir(path, store.name)

    // Fetch asset list (using current project base)
    var db = new Database(src, 'r', { max: 1 })

    let project = await load(db)
    let assets = await getAssets(db, project)

    await db.close()

    // Copy and open db and enable WAL
    await cp(src, dbFile, { force: false, errorOnExist: true })

    db = new Database(dbFile, 'w', {
      max: 1,
      journalMode: 'wal'
    })

    // Update project base and store
    await db.run(
      ...update('project')
        .set({
          base: BASE.PROJECT,
          store: MANAGED_STORE_NAME
        })
        .where({ project_id: project.id }))

    info(`processing ${assets.length} asset(s)`)
    await pMap(assets, async ({ id, ...props }) => {
      let asset = new Asset(props)

      try {
        await asset.check()

        if (!asset.hasChanged) {
          await store.add(asset) // updates asset path and protocol!
        } else {
          errors.push(asset.url)
          warn({
            stack: asset.error?.stack,
            url: asset.url
          }, 'consolidation required')
        }
      } catch (e) {
        errors.push(asset.url)
        warn({ stack: e.stack, url: asset.url }, 'consolidation required')
      }

      // Update all local paths regardless of error status,
      // because the project has a new base!
      if (asset.protocol === 'file') {
        await db.run(
          ...update('photos')
            .set({ path: relative(path, asset.path) })
            .where({ id }))
      }
    }, { concurrency })

    return errors

  } finally {
    await db?.close()
  }
}


/*
 * Opens a project file and returns an array `[db, project]`
 * with a live `db` instance and the project info object.
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
} = {}) {
  let type = getProjectType(path)
  let dbFile = (type === MANAGED) ? join(path, MANAGED_DB_NAME) : path

  let db = await Database.open(dbFile, {
    journalMode: type === MANAGED ? 'wal' : 'delete',
    ...dbOptions
  })

  if (migrate && !db.isReadOnly) {
    var migrations = await db.migrate(migrate)
    await optimize(db)
  }

  let project = await load(db)
  let accessId

  if (migrations?.length > 0) {
    accessId = await beginProjectAccess(db, user)

  } else {
    db.once('update', async () => {
      accessId = await beginProjectAccess(db, user)
    })

    if (!skipIntegrityCheck) {
      await db.check().catch(() => {
        project.isCorrupted = true
      })
    }
  }

  db.once('will-close', async () => {
    if (accessId)
      await endProjectAccess(db, accessId, pruneAccessTable)
  })

  return [db, project]
}

/*
 * Returns stats for a Tropy project file.
 */
export async function pstat(path, modifiedSince) {
  try {
    let type = getProjectType(path)
    let dbFile

    if (type === MANAGED) {
      dbFile = join(path, MANAGED_DB_NAME)

    } else {
      dbFile = path

      if (isManaged(dbFile)) {
        type = MANAGED
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
  let project = await db.get(projectInfo.query)
  assert(project?.id != null, 'invalid project info')

  project.isReadOnly = db.isReadOnly
  project.basePath = resolveBasePath(db, project.base)

  project.isManaged = project.store != null

  if (project.isManaged) {
    project.store = resolve(project.basePath, normalize(project.store))
    project.path = dirname(db.path)

  } else {
    project.path = db.path
  }

  return project
}

export async function save(db, { id, ...props }, basePath) {
  if (basePath && props.store)
    props.store = relative(basePath, props.store)

  if (!empty(props))
    return db.run(
      ...update('project').set(props).where({ project_id: id })
    )
}

export async function lock(dbFile) {
  return chmod(dbFile, 0o444)
}

export async function unlock(dbFile) {
  return chmod(dbFile, 0o666)
}

export async function getAssets(db, { basePath }) {
  let assets = []

  await db.each(assetInfo.query, asset => {
    asset.path = (
      (basePath && asset.protocol === 'file') ?
        resolve(basePath, normalize(asset.path)) : asset.path
    ).normalize()

    assets.push(asset)
  })

  return assets
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
    case BASE.PROJECT:
      return dirname(db.path)
    case BASE.HOME:
      return home
    default:
      return base
  }
}

export function getProjectType(path) {
  switch (extname(path).toLowerCase()) {
    case '.tpy':
      return TPY
    case '.tropy':
    case '.mtpy':
    case '.mpy':
    case '':
      return MANAGED
    default:
      throw new Error(`unknown project file extension ${path}`)
  }
}

const isManaged = (dbFile) =>
  basename(dbFile) === MANAGED_DB_NAME &&
    getProjectType(dirname(dbFile)) === MANAGED

const TPY = 'tpy'
const MANAGED = 'managed'
const MANAGED_DB_NAME = 'project.tpy'
const MANAGED_STORE_NAME = 'assets'

const BASE = {
  PROJECT: 'project',
  HOME: 'home'
}

export const TYPES = [MANAGED, TPY]
export const BASES = [null, BASE.PROJECT, BASE.HOME]

export const pext = (type) => {
  switch (type) {
    case TPY: return 'tpy'
    case MANAGED: return 'tropy'
    default:
      throw new Error(`unknown project type ${type}`)
  }
}

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

const assetInfo =
    select('id', 'protocol', 'path', 'checksum')
      .from('photos')
      .order('protocol, path')

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
