import { put, select, takeEvery as every, fork } from 'redux-saga/effects'
import { Storage } from '../storage.js'
import * as act from '../actions/index.js'

export function *restore(name, ...args) {
  yield put(act[name].restore(Storage.load(name, ...args)))
}

export function *persist(name, ...args) {
  let data = yield select(state => state[name])
  Storage.save(name, data, ...args)
}

export function *storage() {
  yield every(act.storage.reload.type, function* ({ payload }) {
    for (let args of payload) {
      yield fork(restore, ...args)
    }
  })

  yield every(action => action.meta?.persist, function* (action) {
    yield fork(persist, action.meta.persist)
  })
}
