import { call, put, race, take } from 'redux-saga/effects'
import { info, trace, warn } from '../common/log.js'
import { Command } from '../commands/command.js'
import { fail } from '../dialog.js'
import { activity, history } from '../actions/index.js'
import { done } from '../slices/cmd.js'

const cancellation = (id) => ({ payload, type }) => (
  type === activity.cancel.type && payload.id === id
)

export function *exec (options, action) {
  try {
    var cmd = Command.create(action, options)
    yield put(activity.start(action))

    var [cancelled] = yield race([
      take(cancellation(action.meta.seq)),
      call([cmd, cmd.run])
    ])

    if (cmd.isReversible)
      yield put(history.tick(cmd.history))
    if (cmd.error && !action.meta.silent)
      fail(cmd.error, action.type)

  } catch (err) {
    warn({ err }, `${action.type} failed in *exec`)
    if (!cmd) cmd = Command.fail(action, err)

  } finally {
    if (cmd.cancelled && !cmd.error) {
      info(`${cmd} was cancelled ${
        cancelled ? `by #${cancelled.meta.seq}` : 'implicitly'
      }`)
    }

    cmd.finalize(
      yield put(done(
        action,
        cmd.error || cmd.result,
        cmd.meta
      )))

    if (cmd.after) {
      yield put(cmd.after)
    }

    trace('*exec terminated')
  }
}
