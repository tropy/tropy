'use strict'

const fs = require('fs')
const { promisify } = require('util')
const crossZip = require('cross-zip')
const { mkdtmp } = require('./os')

const { readdir, rename, rmdir } = fs.promises

const unzipAsync = promisify(crossZip.unzip)
const zip = promisify(crossZip.zip)

//unzip.sync = crossZip.unzipSync
//zip.sync = crossZip.zipSync

async function unzip(src, dst, { strip } = {}) {
  if (!strip)
    return unzipAsync(src, dst)

  try {
    var tmp = await mkdtmp('tropy-unzip')
    await unzipAsync(src, tmp)
    let [head, ...tail] = await readdir(tmp, { withFileTypes: true })

    if (tail.length > 0 || !head?.isDirectory())
      await rename(tmp, dst)
    else
      await rename(tail, dst)

  } finally {
    if (tmp)
      await rmdir(tmp, { recursive: true })
  }
}

module.exports = {
  unzip,
  zip
}
