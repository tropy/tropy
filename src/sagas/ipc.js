import { eventChannel } from 'redux-saga'
import { ipcRenderer } from 'electron'
import { warn } from '../common/log'
import { getHistory, getAllTags } from '../selectors'
import { PROJECT, TAG, HISTORY } from '../constants'

import {
  call,
  fork,
  put,
  take,
  select,
  takeEvery as every
} from 'redux-saga/effects'

const filters = {
  *[HISTORY.CHANGED]() {
    let summary = yield select(getHistory)
    let messages = yield select(state => state.intl.messages)

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

    yield call([ipcRenderer, ipcRenderer.send], name, data)

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *ipc:forward')
  }
}

function *rsvp(action) {
  try {
    yield call([ipcRenderer, ipcRenderer.send], 'wm', 'rsvp', action)

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

    ipcRenderer.on(name, listener)

    return () => ipcRenderer.removeListener(name, listener)
  })
}

export function *ipc() {
  yield every(({ error, meta }) => !error && meta && meta.ipc, forward)
  yield every(({ meta }) => meta && meta.rsvp && meta.done, rsvp)

  yield fork(receive)
}
