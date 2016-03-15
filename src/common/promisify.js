'use strict'

const bb = require('bluebird')

const { Database, Statement } = require('sqlite3')
const { Pool } = require('generic-pool')

bb.promisifyAll(require('fs'))
bb.promisifyAll([Database, Statement, Pool])

module.exports = bb
