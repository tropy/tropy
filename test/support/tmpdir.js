'use strict'

const { tmpdir } = require('os')
const { join } = require('path')
const { mkdir } = require('fs')
const rmdir = require('./rm')

const TMPDIR = module.exports = join(tmpdir(), `tropy-${Date.now()}`)

before(done => mkdir(TMPDIR, done))

after(() => rmdir(TMPDIR))
