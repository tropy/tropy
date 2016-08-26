'use strict'

const { createAction: action } = require('redux-actions')
const { Storage } = require('../storage')
const { UPDATE } = require('../constants/nav')

function persist(id) {
  return (_, getState) => {
    const { nav } = getState()
    Storage.save('nav', nav, id)
  }
}

function restore(id) {
  return (dispatch) => {
    const nav = Storage.load('nav', id)
    dispatch(update(nav))
  }
}

const update = action(UPDATE)

module.exports = {
  persist,
  restore,
  update
}
