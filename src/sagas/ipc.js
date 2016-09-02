'use strict'

const { takeEvery: every, eventChannel } = require('redux-saga')
const { call, fork, put, take, select } = require('redux-saga/effects')
const { ipcRenderer: ipc } = require('electron')
const { warn, debug } = require('../common/log')
const { id } = require('../common/util')
const { TICK } = require('../constants/history')

module.exports = {

  *forward({ type, payload, meta }) {
    try {
      if (meta && meta.ipc) {
        const data = yield call(ACTION_FILTER[type] || id, payload)
        yield call([ipc, ipc.send], type, data)
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
    yield fork(every, '*', module.exports.forward)
    yield fork(module.exports.receive)
  }

}

const ACTION_FILTER = {
  *[TICK]() {
    // TODO use selector
    const { history } = yield select()
    return {
      past: history.past.length,
      future: history.future.length
    }
  }
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
