import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { extname } from 'node:path'
import { Database } from './db.js'

export function getProjectType(path) {
  switch (extname(path)) {
    case '.tpy':
      return TPY
    case '.tpm':
      return TPM
    default:
      throw new Error(`unknown project file extension ${path}`)
  }
}

export async function pstat(path, modifiedSince) {
  let type = getProjectType(path)
  let dbFile = (type === TPM) ? join(path, 'tropy.sqlite') : path

  let { mtimeMs } = await stat(dbFile)

  if (modifiedSince > mtimeMs)
    return null

  let db = new Database(dbFile, 'r', { max: 1 })
  let stats = await db.get(PROJECT_STATS)

  stats.path = path
  stats.lastModified = mtimeMs

  return stats
}

const TPY = 'tpy'
const TPM = 'tpm'


const NUM_ITEMS =
  'SELECT count(id) FROM items LEFT OUTER JOIN trash USING (id)'

const NUM_PHOTOS =
  'SELECT count(id) FROM photos LEFT OUTER JOIN trash USING (id)'

const NUM_NOTES =
  'SELECT count(note_id) FROM notes'

const PROJECT_STATS = `
    SELECT
      project_id AS id,
      name,
      (${NUM_ITEMS}) AS items,
      (${NUM_PHOTOS}) AS photos,
      (${NUM_NOTES}) AS notes
    FROM project LIMIT 1`
