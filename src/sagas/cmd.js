import { call, put, race, take } from 'redux-saga/effects'
import { info, trace, warn } from '../common/log'
import { Command } from '../commands/command'
import { fail } from '../dialog'
import { activity, history } from '../actions'
import { ACTIVITY } from '../constants'

const TOO_LONG = ARGS.dev ? 500 : 1500

const cancellation = (id) => ({ payload, type }) => (
  type === ACTIVITY.CANCEL && payload.id === id
)

export function commands(scope) {
  return ({ error, meta }) => (
    !error && meta && !meta.done && meta.cmd === scope
  )
}

export function *exec(options, action) {
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
    if (cmd.cancelled && !cmd.error) {
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
