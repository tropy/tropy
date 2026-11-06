import { basename, dirname, extname, join, resolve } from 'node:path'

/*
 * Project file and URL helpers.
 *
 * No dependencies: shared by main and renderer
 * for deriving project information without opening the db.
 */

export const TPY = 'tpy'
export const MANAGED = 'managed'
export const MANAGED_DB_NAME = 'project.tpy'
export const MANAGED_STORE_NAME = 'assets'

export const TYPES = [MANAGED, TPY]

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

export const pext = (type) => {
  switch (type) {
    case TPY: return 'tpy'
    case MANAGED: return 'tropy'
    default:
      throw new Error(`unknown project type ${type}`)
  }
}

export const dbPath = (path) =>
  getProjectType(path) === MANAGED
    ? join(path, MANAGED_DB_NAME)
    : path

export const isManaged = (dbFile) =>
  basename(dbFile).toLowerCase() === MANAGED_DB_NAME &&
  extname(dirname(dbFile)).toLowerCase() === '.tropy'

// NB: may want realpath here for case / symlink issues!
export const projectPath = (path) => {
  path = resolve(path)
  return isManaged(path) ? dirname(path) : path
}

export function urlId (path) {
  if (!path) return ''

  let file = projectPath(String(path))
  return basename(file, extname(file)).toWellFormed().normalize()
}

export function protocolURL (path, { item, photo, selection } = {}) {
  let url = `tropy://project/${encodeURIComponent(urlId(path))}`

  if (item == null)
    return url

  url += `/items/${item}`

  if (photo == null)
    return url

  url += `/${photo}`

  return (selection == null) ? url : `${url}/${selection}`
}
