'use strict'

const { put, select, takeEvery: every, fork } = require('redux-saga/effects')
const { Storage } = require('../storage')
const actions = require('../actions')
const { STORAGE } = require('../constants')

const storage = {

  *restore(name, ...args) {
    const data = Storage.load(name, ...args)
    yield put(actions[name].restore(data))
  },

  *persist(name, ...args) {
    const data = yield select(state => state[name])
    Storage.save(name, data, ...args)
  },

  *reload() {
    yield every(STORAGE.RELOAD, function* (action) {
      for (let args of action.payload) {
        yield fork(storage.restore, ...args)
      }
    })
  }
}

module.exports = storage
