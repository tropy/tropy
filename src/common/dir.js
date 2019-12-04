'use strict'

const { basename, dirname, join } = require('path')
const { stat, readdir } = require('fs').promises
const { tautology } = require('./util')

const ls = async (path, {
  filter = tautology,
  recursive = false
} = {})  => {
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

const expand = async (paths, {
  filter = tautology,
  recursive = false
} = {}) => {
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

module.exports = {
  expand,
  ls
}
