import { basename, extname } from 'node:path'

const COMBINING_MARKS = /[̀-ͯ]/g

export const RESERVED_IDS = new Set([
  'current',
  'import',
  'items',
  'photos',
  'lists',
  'tags',
  'data',
  'notes',
  'transcriptions',
  'selections'
])

const sanitize = (input) => {
  let id = String(input ?? '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!id) return 'project'
  if (RESERVED_IDS.has(id)) return `${id}-project`

  return id
}

export function urlId (path) {
  let file = String(path ?? '')
  return sanitize(basename(file, extname(file)))
}

export function protocolURL (path, { item, photo } = {}) {
  let id = urlId(path)

  return (item != null && photo != null) ?
    `tropy://project/${id}/items/${item}/${photo}` :
    `tropy://project/${id}/`
}
