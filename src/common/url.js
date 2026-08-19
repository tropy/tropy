import { basename, extname } from 'node:path'

export function urlId (path) {
  let file = String(path ?? '')
  return encodeURIComponent(
    basename(file, extname(file)).toWellFormed().normalize())
}

export function protocolURL (path, { item, photo } = {}) {
  let id = urlId(path)

  return (item != null && photo != null) ?
    `tropy://project/${id}/items/${item}/${photo}` :
    `tropy://project/${id}/`
}
