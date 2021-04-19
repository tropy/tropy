import { put, select, takeEvery as every, fork } from 'redux-saga/effects'
import { Storage } from '../storage'
import * as act from '../actions'
import { STORAGE } from '../constants'
import { get } from '../common/util'

const PERSIST = action => action?.meta?.persist

export function *restore(name, ...args) {
  let data = Storage.load(name, ...args)
  yield put(get(act, name).restore(data))
}

export function *persist(name, ...args) {
  let data = yield select(state => get(state, name))
  Storage.save(name, data, ...args)
}

export function *storage() {
  yield every(STORAGE.RELOAD, function* (action) {
    for (let args of action.payload) {
      yield fork(restore, ...args)
    }
  })

  yield every(PERSIST, function* (action) {
    yield fork(persist, action.meta.persist)
  })
}
