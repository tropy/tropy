'use strict'

const { join } = require('path')
const { readdir } = require('fs').promises
const { tautology } = require('./util')

module.exports = {
  ls: async function ls(path, {
    filter = tautology,
    recursive = false
  } = {})  {
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
}
