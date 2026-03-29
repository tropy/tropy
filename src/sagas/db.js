import { eventChannel } from 'redux-saga'
import { call, put, take } from 'redux-saga/effects'
import { debug, warn } from '../common/log.js'
import { fail } from '../dialog.js'


export function ErrorChannel (db) {
  return eventChannel(emitter => {
    let onError = (error) => emitter({ error })
    db.on('error', onError)

    return () => {
      db.removeListener('error', onError)
    }
  })
}

export function *handleDatabaseErrors (db, actions = {}) {
  try {
    var channel = yield call(ErrorChannel, db)

    while (true) {
      let { error: err } = yield take(channel)

      if (err.code in actions) {
        yield put(actions[err.code](err))

      } else {
        warn({ err }, 'db error')

        // Report the error but don't wait for the response to make
        // sure the default action is dispatched without delay!
        fail(err, `db.${err.code}`, db.path).catch()

        if (actions.default) {
          yield put(actions.default(err))
        }
      }
    }
  } catch (err) {
    warn({ err }, 'unexpected error in *handleDatabaseErrors')

  } finally {
    channel.close()
    debug('*handleDatabaseErrors terminated')
  }
}
