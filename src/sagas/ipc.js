'use strict'

const { takeEvery: every, eventChannel } = require('redux-saga')
const { call, fork, put, take } = require('redux-saga/effects')
const { ipcRenderer: ipc } = require('electron')
const { warn, debug } = require('../common/log')
const { id } = require('../common/util')
const { TICK } = require('../constants/history')

module.exports = {

  forward({ type, payload, meta }) {
    if (meta && meta.ipc) {
      ipc.send(type, (ACTION_FILTER[type] || id)(payload))
    }
  },

  *receive() {
    const disp = yield call(channel, 'dispatch')

    while (true) {
      try {
        const action = yield take(disp)
        yield put(action)

      } catch (error) {
        warn(`unexpected error in ipc:receive: ${error.message}`)
        debug(error.stack)
      }
    }
  },

  *ipc() {
    yield fork(every, '*', module.exports.forward)
    yield fork(module.exports.receive)
  }

}

const ACTION_FILTER = {
  [TICK]: payload => ({
    past: payload.past.length,
    future: payload.future.length
  })
}

function channel(name) {
  return eventChannel(emitter => {
    const listener = (_, action) => {
      emitter(action)
    }

    ipc.on(name, listener)

    return () => ipc.removeListener(name, listener)
  })
}
