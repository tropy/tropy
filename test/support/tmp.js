'use strict'

const { tmpdir } = require('os')
const { join } = require('path')
const fs = require('fs')

function mkdtmp() {
  let dir = fs.mkdtempSync(join(tmpdir(), 'tropy-test-'))
  after(() => fs.promises.rm(dir, { recursive: true }))
  return dir
}

function mktmp(file) {
  return join(mkdtmp(), file)
}

module.exports = {
  mkdtmp,
  mktmp
}
