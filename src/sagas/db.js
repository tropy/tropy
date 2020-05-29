'use strict'

const { eventChannel } = require('redux-saga')
const { call, put, take } = require('redux-saga/effects')
const { debug, warn } = require('../common/log')
const { fail } = require('../dialog')


function ErrorChannel(db) {
  return eventChannel(emitter => {
    db.on('error', emitter)

    return () => {
      db.removeListener('error', emitter)
    }
  })
}

function* handleDatabaseErrors(db, actions) {
  try {
    var channel = yield call(ErrorChannel, db)

    while (true) {
      let e = yield take(channel)

      if (e.code in actions) {
        yield put(actions[e.code](e))

      } else {
        warn({ stack: e.stack }, 'unexpected db error')

        yield call(fail, e, db.path)
        yield put(actions.default(e))
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
