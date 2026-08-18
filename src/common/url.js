import { basename, extname } from 'node:path'

const sanitize = (input) =>
  String(input ?? '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function urlId (path) {
  let file = String(path ?? '')
  return sanitize(basename(file, extname(file))) || 'project'
}

export function protocolURL (path, { item, photo } = {}) {
  let id = urlId(path)

  return (item != null && photo != null) ?
    `tropy://project/${id}/items/${item}/${photo}` :
    `tropy://project/${id}/`
}
