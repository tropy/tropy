'use strict'

const { tmpdir } = require('os')
const { join } = require('path')
const { mkdtempSync: mkdir } = require('fs')
const { rm } = require('./rm')

module.exports = {
  mkdtmp() {
    const dir = mkdir(join(tmpdir(), 'tropy-test-'))
    after(() => rm(dir))
    return dir
  }
}
