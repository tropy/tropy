'use strict'

const { tmpdir } = require('os')
const { join } = require('path')
const { mkdir, rmdir } = require('fs')

const TMPDIR = module.exports = join(tmpdir(), `tropy-${Date.now()}`)

before(done => mkdir(TMPDIR, done))

after(done => rmdir(TMPDIR, done))
