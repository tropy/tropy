'use strict'

const { put, select } = require('redux-saga/effects')
const { Storage } = require('../storage')
const { restore } = require('../actions/nav')

module.exports = {

  *restore(id) {
    const nav = Storage.load('nav', id)
    yield put(restore(nav))
  },

  *persist(id) {
    const { nav } = yield select()
    Storage.save('nav', nav, id)
  }
}
