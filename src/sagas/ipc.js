'use strict'

const { takeEvery: every, eventChannel } = require('redux-saga')
const { call, fork, put, take } = require('redux-saga/effects')
const { ipcRenderer: ipc } = require('electron')
const { warn, debug } = require('../common/log')

function channel(name) {
  return eventChannel(emitter => {
    const listener = (_, action) => {
      emitter(action)
    }

    ipc.on(name, listener)

    return () => ipc.removeListener(name, listener)
  })
}

module.exports = {

  forward({ type, payload, meta }) {
    if (meta && meta.ipc) ipc.send(type, payload)
  },

  *receive() {
    const disp = yield call(channel, 'dispatch')

    while (true) {
      try {
        const action = yield take(disp)
        yield put(action)

      } catch (error) {
        warn(`unexpected error in ipc:receive: ${error.message}`)
        debug(error)
      }
    }
  },

  *ipc() {
    yield fork(every, '*', module.exports.forward)
    yield fork(module.exports.receive)
  }

}
