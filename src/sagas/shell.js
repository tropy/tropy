'use strict'

const { SHELL } = require('../constants')
const { shell } = require('electron')
const { take } = require('redux-saga/effects')
const { debug, warn } = require('../common/log')
const { values } = Object

module.exports = {
  *shell() {
    while (true) {
      try {
        const { type, payload } = yield take(values(SHELL))
        shell[type.split('.').pop()](...payload)

      } catch (error) {
        warn(`unexpected error in *prefs.main: ${error.message}`)
        debug(error.stack)
      }
    }
  }
}
