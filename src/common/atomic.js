'use strict'

const { promisify } = require('./promisify')

const write = promisify(require('write-file-atomic'))
write.sync = require('write-file-atomic').sync

module.exports = {
  write
}
