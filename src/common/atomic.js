'use strict'

const util = require('util')
const write = util.promisify(require('write-file-atomic'))
write.sync = require('write-file-atomic').sync

module.exports = {
  write
}
