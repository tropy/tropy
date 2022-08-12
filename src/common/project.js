import assert from 'node:assert'
import { stat } from 'node:fs/promises'
import { extname } from 'node:path'
import { Database } from './db.js'


export async function pstat(path, modifiedSince) {

  let ext = extname(path)
  assert(ext === '.tpy', `unknown file extension "${ext}"`)

  // TODO managed project

  let { mtimeMs } = await stat(path)

  if (modifiedSince > mtimeMs)
    return null

  let db = new Database(path, 'r', { max: 1 })
  let stats = await db.get(PROJECT_STATS)

  stats.path = path
  stats.lastModified = mtimeMs

  return stats
}

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
