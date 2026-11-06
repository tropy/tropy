import assert from 'node:assert'
import { existsSync } from 'node:fs'
import { chmod, cp, stat, mkdir } from 'node:fs/promises'
import { dirname, join, resolve, relative } from 'node:path'
import { randomUUID as uuid } from 'node:crypto'
import { Database } from './db.js'
import { Migration } from './migration.js'
import { home, normalize } from './os.js'
import sql, { SET } from './sql.js'
import { empty, pMap } from './util.js'
import { CodeError, IntegrityError } from './error.js'
import { info, warn } from './log.js'
import { dbPath, getProjectType, projectPath, MANAGED, MANAGED_STORE_NAME } from './project-file.js'

import * as access from '../models/access.js'
import { Asset } from '../asset/asset.js'
import { Store } from '../asset/store.js'


/*
 * Creates a new Tropy project.
 */
export async function create (path, schema, appDir, {
  autoclose = true,
  name = 'Tropy',
  base = null,
  id = uuid(),
  overwrite = false
} = {}) {
  try {
    let type = getProjectType(path)
    let dbFile = dbPath(path)
    let store = null

    await checkProjectPath(path, overwrite)
    info({ path }, 'creating new project')

    if (type === MANAGED) {
      store = MANAGED_STORE_NAME
      base = BASE.PROJECT

      await makeProjectDir(path, store, appDir)

    } else {
      assert(BASES.includes(base),
        `project base not supported: "${base}"`)
    }

    var db = new Database(dbFile, 'w+', {
      max: 1,
      journalMode: type === MANAGED ? 'wal' : 'delete'
    })

    await db.read(schema)
    await db.run(sql`
      INSERT INTO project (project_id, name, base, store)
        VALUES (${id}, ${name}, ${base}, ${store})`)

    if (autoclose) {
      await db.close()
      db = null
    }

    return db

  } catch (err) {
    await db?.close()
    throw err
  }
}

// Ensures that a project path is available
async function checkProjectPath (path, overwrite = false) {
  if (existsSync(path)) {
    if (!overwrite)
      throw new CodeError('EEXIST', `project file exists: "${path}"`)

    warn({ path }, 'trashing old project')
    await moveToTrash(path)
  }
}

// Creates the folder structure for managed projects.
async function makeProjectDir (path, store, appDir) {
  await mkdir(path)
  await mkdir(join(path, store))

  await cp(
    join(appDir, 'res/icons/mime/folder/1024x1024.png'),
    join(path, '.DirIcon'))
  await cp(
    join(appDir, 'res/icons/mime/folder.ico'),
    join(path, 'folder.ico'))
  await cp(
    join(appDir, 'res/icons/mime/folder.ini'),
    join(path, 'desktop.ini'))
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
export async function convert (src, path, appDir, {
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
    info({ src, dest: path }, 'converting project')

    let dbFile = dbPath(path)
    let store = new Store(join(path, MANAGED_STORE_NAME))
    let errors = []

    await makeProjectDir(path, store.name, appDir)

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
    await db.run(sql`
      UPDATE project
        SET base = ${BASE.PROJECT}, store = ${MANAGED_STORE_NAME}
        WHERE project_id = ${project.id}`)

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
            err: asset.error,
            url: asset.url
          }, 'consolidation required')
        }
      } catch (err) {
        errors.push(asset.url)
        warn({ err, url: asset.url }, 'consolidation required')
      }

      // Update all local paths regardless of error status,
      // because the project has a new base!
      if (asset.protocol === 'file') {
        await db.run(sql`
          UPDATE photos
            SET path = ${relative(path, asset.path)}, protocol = 'file'
            WHERE id = ${id}`)
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
 * Projects cannot be opened
 * if their compatibility number is higher
 * than the one declared by the migrations in the `migrate` folder.
 *
 * Projects with a schema version
 * newer than the latest migration in the `migrate` folder
 * are flagged with a warning.
 *
 * Additionally, the following database event handlers are attached:
 * - After the first write (or immediately after migrations)
 *   an access row will be created using the given `user` id.
 * - Before closing the database, the access record will be finalized
 *   and the access table pruned.
 *
 */
export async function open (path, {
  migrate,
  pruneAccessTable = true,
  skipIntegrityCheck = false,
  user,
  ...dbOptions
} = {}) {
  let start = Date.now()

  path = projectPath(path)

  let type = getProjectType(path)
  let dbFile = dbPath(path)

  let db = await Database.open(dbFile, {
    journalMode: type === MANAGED ? 'wal' : 'delete',
    ...dbOptions
  })

  if (migrate) {
    let compatibility = await db.compatibility()

    if (compatibility > 0 &&
      compatibility > await Migration.compatibility(migrate)) {
      await db.close()
      throw new CodeError('ENEWER',
        `project file requires newer version: ${compatibility}`)
    }
  }

  let warnings = []

  if (migrate && !db.isReadOnly) {
    var migrations = await db.migrate(migrate)

    if (migrations.length > 0) {
      await optimize(db)

      if (!skipIntegrityCheck) {
        await db.check().catch((err) => {
          warn({ err }, 'project check failed')
          if (err instanceof IntegrityError) warnings.push('corrupted')
        })
      }
    }
  }

  let project = await load(db)
  let schema = await db.version()
  let session

  project.warnings = warnings

  if (project.isManaged && !existsSync(project.store)) {
    warn({ path: project.store }, 'project store missing')
    project.warnings.push('store')
  }

  if (migrate) {
    let latest = (await Migration.all(migrate)).at(-1)?.number

    if (schema > latest) {
      warn(`db schema version #${schema} is newer than #${latest}`)
      project.warnings.push('newer')
    }
  }

  let recordAccess = () => {
    session = access.open(db, user).catch((err) => {
      warn({ err }, 'failed to record project access')
    })
  }

  if (migrations?.length > 0)
    recordAccess()
  else
    db.once('update', recordAccess)

  db.once('will-close', async () => {
    db.off('update', recordAccess)

    await session?.then(id =>
      access.close(db, id, { prune: pruneAccessTable })
    ).catch(err => {
      warn({ err }, 'failed to finalize project access')
    })
  })

  info({
    project: project.id,
    path: project.path,
    ms: Date.now() - start,
    schema,
    migrations: migrations?.length ?? 0,
    isReadOnly: project.isReadOnly,
    warnings: project.warnings
  }, 'project opened')

  return [db, project]
}

/*
 * Returns stats for a Tropy project file.
 */
export async function pstat (path, modifiedSince) {
  try {
    let dbFile = dbPath(path)
    path = projectPath(path)

    let { mtimeMs } = await stat(dbFile)

    if (modifiedSince > mtimeMs)
      return null

    var db = new Database(dbFile, 'r', { max: 1 })
    let stats = await db.get(projectStats)

    stats.path = path
    stats.lastModified = mtimeMs

    return stats

  } finally {
    await db?.close()
  }
}


export async function load (db) {
  let project = await db.get(projectInfo)
  assert(project?.id != null, 'invalid project info')

  project.isReadOnly = db.isReadOnly
  project.basePath = resolveBasePath(db, project.base)

  project.isBlank =
    (await db.get('SELECT 1 FROM subjects LIMIT 1')) == null

  project.isManaged = project.store != null

  if (project.isManaged)
    project.store = resolve(project.basePath, normalize(project.store))

  project.path = projectPath(db.path)

  return project
}

/**
  * Returns a mapping of all asset URLs to ids in the project.
  * For local assets the file path is returned, resolved using `basePath`.
  */
export async function list (db, { basePath }) {
  let assets = new Map

  await db.each(
    'SELECT id, path, protocol FROM photos',
    ({ id, path, protocol }) => {
      path = (protocol === 'file')
        ? (basePath ? resolve(basePath, normalize(path)) : normalize(path))
        : `${protocol}://${path}`
      assets.set(path, id)
    })

  return assets
}

export async function save (db, { id, ...props }, basePath) {
  for (let key in props)
    assert(['name', 'base', 'store'].includes(key), `cannot save ${key}`)

  if (basePath && props.store)
    props.store = relative(basePath, props.store)

  if (!empty(props))
    return db.run(sql`
      UPDATE project ${SET(props)} WHERE project_id = ${id}`)
}

export async function lock (dbFile) {
  return chmod(dbFile, 0o444)
}

export async function unlock (dbFile) {
  return chmod(dbFile, 0o666)
}

export async function getAssets (db, { basePath }) {
  let assets = []

  await db.each(assetInfo, asset => {
    asset.path = (
      (basePath && asset.protocol === 'file') ?
        resolve(basePath, normalize(asset.path)) : asset.path
    ).normalize()

    assets.push(asset)
  })

  return assets
}

/*
 * Creates an optimized copy of a managed project,
 * converting assets to jpeg or png if they have transparency.
 */
export async function optimizeAssets (src, dest, appDir, {
  concurrency = 4,
  density = 72,
  overwrite = false,
  quality = 0.8,
  processAsset
} = {}) {
  try {
    assert(getProjectType(src) === MANAGED, 'source must be a managed project')
    assert(getProjectType(dest) === MANAGED, 'target must be a managed project')

    await checkProjectPath(dest, overwrite)
    info({ src, dest }, 'optimizing project')

    let srcDbFile = dbPath(src)
    let destDbFile = dbPath(dest)
    let store = new Store(join(dest, MANAGED_STORE_NAME))

    await makeProjectDir(dest, store.name, appDir)

    await Database.backup(srcDbFile, destDbFile, conn =>
      conn.run('UPDATE project SET project_id = ?', uuid()))

    var db = new Database(destDbFile, 'w', {
      max: 1,
      journalMode: 'wal'
    })

    let assets = await getAssets(db, { basePath: dirname(srcDbFile) })

    info(`optimizing ${assets.length} asset(s)`)

    await pMap(assets, async ({ id, ...props }) => {
      let updates = await processAsset({
        ...props,
        density,
        projectPath: dest,
        quality,
        store
      })

      if (updates == null) return

      await db.run(sql`
        UPDATE photos ${SET(updates)} WHERE id = ${id}`)
    }, { concurrency })

    await db.optimize()

  } finally {
    await db?.close()
  }
}

const FTS = ['fts_notes', 'fts_metadata', 'fts_transcriptions']

export async function optimize (db) {
  for (let fts of FTS)
    await db.exec(`INSERT INTO ${fts}(${fts}) VALUES ('optimize')`)

  await db.exec('VACUUM')
}

export async function reindex (db) {
  await db.exec('REINDEX')

  for (let fts of FTS)
    await db.exec(`INSERT INTO ${fts}(${fts}) VALUES ('rebuild')`)
}


export function resolveBasePath (db, base) {
  switch (base) {
    case BASE.PROJECT:
      return dirname(db.path)
    case BASE.HOME:
      return home
    default:
      return base
  }
}

const BASE = {
  PROJECT: 'project',
  HOME: 'home'
}

export const BASES = [null, BASE.PROJECT, BASE.HOME]

const projectInfo = `
  SELECT project_id AS id, name, base, store
    FROM project
    LIMIT 1`

const projectStats = `
  SELECT project_id AS id, name,
      (SELECT count(*) FROM items
        WHERE id NOT IN (SELECT id FROM trash)) AS items,
      (SELECT count(*) FROM photos
        WHERE id NOT IN (SELECT id FROM trash)
          AND item_id NOT IN (SELECT id FROM trash)) AS photos,
      (SELECT count(*) FROM notes
        LEFT JOIN selections AS s ON s.id = notes.id
        JOIN photos AS p ON p.id = coalesce(s.photo_id, notes.id)
        WHERE notes.deleted IS NULL
          AND notes.id NOT IN (SELECT id FROM trash)
          AND p.id NOT IN (SELECT id FROM trash)
          AND p.item_id NOT IN (SELECT id FROM trash)) AS notes
    FROM project
    LIMIT 1`

const assetInfo = `
  SELECT id, item_id AS item, position, protocol, path, checksum, mimetype, page
    FROM photos
    ORDER BY item_id, position, id`

// NB delaying the electron import here on purpose
// so that we can load the utilities from Node.js scripts
async function moveToTrash (path) {
  const { shell } = await import('electron')
  await shell.trashItem(path)
}
