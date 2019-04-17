'use strict'

const { tmpdir } = require('os')
const { join } = require('path')
const { mkdtempSync: mkdir } = require('fs')
const { rm } = require('./rm')

function mkdtmp() {
  let dir = mkdir(join(tmpdir(), 'tropy-test-'))
  after(() => rm(dir))
  return dir
}

function mktmp(file) {
  return join(mkdtmp(), file)
}

module.exports = {
  mkdtmp,
  mktmp
}
