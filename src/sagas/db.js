'use strict'

const { eventChannel } = require('redux-saga')
const { call, put, take } = require('redux-saga/effects')
const { debug, warn } = require('../common/log')
const { fail } = require('../dialog')


function ErrorChannel(db) {
  return eventChannel(emitter => {
    let onError = (error) => emitter({ error })
    db.on('error', onError)

    return () => {
      db.removeListener('error', onError)
    }
  })
}

function *handleDatabaseErrors(db, actions) {
  try {
    var channel = yield call(ErrorChannel, db)

    while (true) {
      let { error } = yield take(channel)

      if (error.code in actions) {
        yield put(actions[error.code](error))

      } else {
        warn({ stack: error.stack }, 'unexpected db error')

        yield call(fail, error, db.path)
        yield put(actions.default(error))
      }
    }
  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *handleDatabaseErrors')

  } finally {
    channel.close()
    debug('*handleDatabaseErrors terminated')
  }
}

module.exports = {
  ErrorChannel,
  handleDatabaseErrors
}
