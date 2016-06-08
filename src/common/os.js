'use strict'

const { release } = require('os')

module.exports = {

  get EL_CAPITAN() {
    return process.platform === 'darwin' && release() > '15'
  }

}
