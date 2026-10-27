import { basename, dirname, extname } from 'node:path'

export const TPY = 'tpy'
export const MANAGED = 'managed'
export const MANAGED_DB_NAME = 'project.tpy'

export function getProjectType (path) {
  switch (extname(path).toLowerCase()) {
    case '.tpy':
      return TPY
    case '.tropy':
      return MANAGED
    default:
      throw new Error(`unknown project file extension ${path}`)
  }
}

export const isManaged = (dbFile) =>
  basename(dbFile) === MANAGED_DB_NAME &&
  extname(dirname(dbFile)).toLowerCase() === '.tropy'

// Managed projects are identified by their folder,
// even when opened via the database file inside.
export function projectPath (path) {
  return isManaged(path) ? dirname(path) : path
}

export function urlId (path) {
  let file = projectPath(String(path ?? ''))
  return encodeURIComponent(
    basename(file, extname(file)).toWellFormed().normalize())
}

export function protocolURL (path, { item, photo } = {}) {
  let id = urlId(path)

  return (item != null && photo != null) ?
    `tropy://project/${id}/items/${item}/${photo}` :
    `tropy://project/${id}/`
}
