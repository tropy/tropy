'use strict'

const { put, select, takeEvery: every, fork } = require('redux-saga/effects')
const { get } = require('../common/util')
const { Storage } = require('../storage')
const actions = require('../actions')
const { STORAGE } = require('../constants')

const PERSIST = action => get(action, ['meta', 'persist'])

const storage = {

  *restore(name, ...args) {
    const data = Storage.load(name, ...args)
    yield put(actions[name].restore(data))
  },

  *persist(name, ...args) {
    const data = yield select(state => state[name])
    Storage.save(name, data, ...args)
  },

  *start() {
    yield every(STORAGE.RELOAD, function* (action) {
      for (let args of action.payload) {
        yield fork(storage.restore, ...args)
      }
    })

    yield every(PERSIST, function* (action) {
      yield fork(storage.persist, action.meta.persist)
    })
  }
}

module.exports = storage
