'use strict'

const { put, select } = require('redux-saga/effects')
const { Storage } = require('../storage')
const actions = require('../actions')

module.exports = {

  *restore(name, ...args) {
    const data = Storage.load(name, ...args)
    yield put(actions[name].restore(data))
  },

  *persist(name, ...args) {
    const data = yield select(state => state[name])
    Storage.save(name, data, ...args)
  }

}
