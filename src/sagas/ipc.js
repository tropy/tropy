'use strict'

const { takeEvery: every, eventChannel } = require('redux-saga')
const { call, fork, put, take, select } = require('redux-saga/effects')
const { ipcRenderer: ipc } = require('electron')
const { warn, debug } = require('../common/log')
const { identity } = require('../common/util')
const history = require('../selectors/history')
const { TICK, DROP, UNDO, REDO } = require('../constants/history')

module.exports = {

  *forward({ type, payload, meta }) {
    try {
      if (meta && meta.ipc) {
        const event = meta.ipc === true ? type : meta.ipc
        const data = yield call(FILTER[type] || identity, payload)
        yield call([ipc, ipc.send], event, data)
      }

    } catch (error) {
      warn(`unexpected error in ipc:forward: ${error.message}`)
      debug(error.message, error.stack)
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
        debug(error.message, error.stack)
      }
    }
  },

  *ipc() {
    yield every('*', module.exports.forward)
    yield fork(module.exports.receive)
  }

}

const FILTER = {
  *[TICK]() {
    return yield select(history.length)
  }
}

FILTER[DROP] = FILTER[UNDO] = FILTER[REDO] = FILTER[TICK]

function channel(name) {
  return eventChannel(emitter => {
    const listener = (_, action) => {
      emitter(action)
    }

    ipc.on(name, listener)

    return () => ipc.removeListener(name, listener)
  })
}
