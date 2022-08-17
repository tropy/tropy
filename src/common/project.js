import assert from 'node:assert'
import { access, stat, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { extname } from 'node:path'
import { v4 as uuid } from 'uuid'
import { Database } from './db.js'
import { select, into } from './query.js'


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
      dbFile = join(path, 'project.tpy')
      store = 'assets'
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

    // TODO enable WAL for TPM

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

export async function pstat(path, modifiedSince) {
  let type = getProjectType(path)
  let dbFile = (type === TPM) ? join(path, 'project.typ') : path

  let { mtimeMs } = await stat(dbFile)

  if (modifiedSince > mtimeMs)
    return null

  let db = new Database(dbFile, 'r', { max: 1 })
  let stats = await db.get(projectStats.query)

  stats.path = path
  stats.lastModified = mtimeMs

  return stats
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

export const TPY = 'tpy'
export const TPM = 'tpm'

const projectStats =
  select({
    id: 'project_id',
    name: 'name',
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
