'use strict'

const { debug, warn } = require('../common/log')
debug('cmd 1')
const { exec } = require('../commands')
debug('cmd 2')
const { fail } = require('../dialog')
debug('cmd 3')
const { put } = require('redux-saga/effects')
debug('cmd 4')
const activity = require('../actions/activity')
const history = require('../actions/history')
debug('cmd 5')

const TOO_LONG = ARGS.dev ? 500 : 1500

module.exports = {
  *exec(options, action) {
    try {
      const cmd = yield exec(action, options)
      const { type, meta } = action

      yield put(activity.done(action, cmd.error || cmd.result, cmd.meta))

      if (meta.history && cmd.isomorph) {
        yield put(history.tick(cmd.history(), meta.history))
      }

      if (cmd.error) fail(cmd.error, type)
      if (!cmd.isInteractive && cmd.duration > TOO_LONG) warn(`SLOW: ${type}`)

    } catch (error) {
      warn(`${action.type} failed in *exec: ${error.message}`, {
        stack: error.stack
      })
    }
  }
}
debug('cmd 6')
