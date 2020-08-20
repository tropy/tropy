'use strict'

const { promisify } = require('util')
const crossZip = require('cross-zip')

const unzip = promisify(crossZip.unzip)
const zip = promisify(crossZip.zip)

//unzip.sync = crossZip.unzipSync
//zip.sync = crossZip.zipSync

module.exports = {
  unzip,
  zip
}
