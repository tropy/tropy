'use strict'

const { eventChannel } = require('redux-saga')
const {
  call, fork, put, take, select, takeEvery: every
} = require('redux-saga/effects')

const { ipcRenderer: ipc } = require('electron')
const { warn } = require('../common/log')
const history = require('../selectors/history')
const { getAllTags } = require('../selectors')
const { PROJECT, TAG, HISTORY } = require('../constants')

const filters = {
  *[HISTORY.CHANGED]() {
    const summary = yield select(history.summary)
    const messages = yield select(state => state.intl.messages)

    if (summary.undo != null) {
      summary.undo = messages[`action.${summary.undo}`] || summary.undo
    }

    if (summary.redo != null) {
      summary.redo = messages[`action.${summary.redo}`] || summary.redo
    }

    return summary
  },

  *[TAG.CHANGED]() {
    return yield select(getAllTags)
  },

  *[PROJECT.UPDATE]() {
    return yield select(state => state.project)
  }
}

function *forward({ type, payload, meta }) {
  try {
    let name = meta.ipc === true ? type : meta.ipc

    let data = (name in filters) ?
      yield call(filters[name], payload) :
      payload

    yield call([ipc, ipc.send], name, data)

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *ipc:forward')
  }
}

function *rsvp(action) {
  try {
    yield call([ipc, ipc.send], 'wm', 'rsvp', action)

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *ipc:rsvp')
  }
}

function *receive() {
  let dispatches = yield call(channel, 'dispatch')

  while (true) {
    let action = yield take(dispatches)
    yield put(action)
  }
}

function channel(name) {
  return eventChannel(emitter => {
    const listener = (_, ...actions) => {
      try {
        for (let action of actions) emitter(action)
      } catch (e) {
        warn({ stack: e.stack }, `unexpected error in channel "${name}"`)
      }
    }

    ipc.on(name, listener)

    return () => ipc.removeListener(name, listener)
  })
}

module.exports = {
  *ipc() {
    yield every(({ error, meta }) => !error && meta && meta.ipc, forward)
    yield every(({ meta }) => meta && meta.rsvp && meta.done, rsvp)

    yield fork(receive)
  }
}
