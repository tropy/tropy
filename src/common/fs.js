import fs from 'node:fs'
import { access, stat, readdir } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { tautology } from './util.js'


export function canWrite(file) {
  return access(file, fs.constants.W_OK)
    .then(() => true, () => false)
}

export async function ls(path, {
  filter = tautology,
  recursive = false
} = {}) {
  let files = []
  let entries = await readdir(path, { withFileTypes: true })

  for (let entry of entries) {
    if (entry.isFile()) {
      if (filter(entry, path))
        files.push(join(path, entry.name))

    } else {
      if (recursive && entry.isDirectory())
        files = files.concat(
          await ls(join(path, entry.name), {
            filter,
            recursive
          }))
    }
  }

  return files
}

export async function expand(paths, {
  filter = tautology,
  recursive = false
} = {}) {
  let files = []

  for (let path of paths) {
    let stats = await stat(path)

    if (stats.isDirectory()) {
      files = files.concat(
        await ls(path, {
          filter,
          recursive
        }))
    }

    if (stats.isFile()) {
      if (filter({ name: basename(path) }, dirname(path)))
        files.push(path)
    }
  }

  return files
}
