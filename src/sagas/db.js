'use strict'

const { eventChannel } = require('redux-saga')
const { call, put, take } = require('redux-saga/effects')
const { warn } = require('../common/log')
const { fail } = require('../dialog')


function ErrorChannel(db) {
  return eventChannel(emitter => {
    db.on('error', error => { emitter({ error }) })
    return () => {
      db.removeEventListener('error', emitter)
    }
  })
}

function onErrorPut(action, times = 1) {
  return function* onErrorPutAction(db) {
    const channel = yield call(ErrorChannel, db)
    const { error } = yield take(channel)

    warn(`unexpected db error: ${error.message}`, {
      stack: error.stack
    })

    yield call(fail, error, db.path)
    yield put(action(error))

    if (times != null) {
      if (--times <= 0) channel.close()
    }
  }
}

module.exports = {
  ErrorChannel,
  onErrorPut
}
