'use strict'

const { trace, warn } = require('../common/log')
const { exec } = require('../commands')
const { fail } = require('../dialog')
const { call, put, race, take } = require('redux-saga/effects')
const activity = require('../actions/activity')
const history = require('../actions/history')
const { ACTIVITY } = require('../constants')

const TOO_LONG = ARGS.dev ? 500 : 1500

const cancellationFor = (id) => ({ payload, type }) => (
  type === ACTIVITY.CANCEL && payload.id === id
)

module.exports = {
  *exec(options, action) {
    try {
      var { cmd, cancellation } = yield race({
        cmd: call(exec, action, options),
        cancellation: take(cancellationFor(action.meta.seq))
      })

      if (cmd) {
        let { type, meta } = action

        if (meta.history && cmd.isomorph) {
          yield put(history.tick(cmd.history(), meta.history))
        }

        if (cmd.error)
          fail(cmd.error, type)
        if (!cmd.isInteractive && cmd.duration > TOO_LONG)
          warn(`SLOW: ${type}`)
      }

    } catch (e) {
      warn({ stack: e.stack }, `${action.type} failed in *exec`)
      if (!cmd) cmd = { error: e }

    } finally {
      if (!cmd) {
        cmd = {
          error: new Error(`command cancelled ${
            cancellation ?
              `by #${cancellation.meta.seq}` :
              'implicitly'
          }`)
        }
      }

      yield put(activity.done(action, cmd.error || cmd.result, cmd.meta))

      if (cmd.finally) {
        yield put(cmd.finally)
      }

      trace('*exec terminated')
    }
  }
}
