'use strict'

const { SHELL } = require('../constants')
const { shell } = require('electron')
const { take } = require('redux-saga/effects')
const { warn } = require('../common/log')
const { values } = Object

module.exports = {
  *shell() {
    while (true) {
      try {
        let { type, payload } = yield take(values(SHELL))
        shell[type.split('.').pop()](...payload)
      } catch (e) {
        warn({ stack: e.stack }, 'unexpected error in *shell')
      }
    }
  }
}
