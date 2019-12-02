'use strict'

const { info, trace, warn } = require('../common/log')
const { Command } = require('../commands')
const { fail } = require('../dialog')
const { call, put, race, take } = require('redux-saga/effects')
const activity = require('../actions/activity')
const history = require('../actions/history')
const { ACTIVITY } = require('../constants')

const TOO_LONG = ARGS.dev ? 500 : 1500

const cancellation = (id) => ({ payload, type }) => (
  type === ACTIVITY.CANCEL && payload.id === id
)

module.exports = {
  *exec(options, action) {
    try {
      var cmd = Command.create(action, options)

      var [cancelled] = yield race([
        take(cancellation(action.meta.seq)),
        call([cmd, cmd.run])
      ])

      if (cmd.isReversible)
        yield put(history.tick(cmd.history))
      if (cmd.error)
        fail(cmd.error, action.type)
      if (cmd.duration > TOO_LONG)
        warn(`SLOW: ${cmd}`)

    } catch (e) {
      warn({ stack: e.stack }, `${action.type} failed in *exec`)
      if (!cmd) cmd = { error: e }

    } finally {
      if (cmd.cancelled) {
        info(`${cmd} was cancelled ${
          cancelled ?
            `by #${cancelled.meta.seq}` :
            'implicitly'
        }`)
      }

      yield put(activity.done(action, cmd.error || cmd.result, cmd.meta))

      if (cmd.after) {
        yield put(cmd.after)
      }

      trace('*exec terminated')
    }
  }
}
