'use strict'

const { Storage } = require('../storage')
const { UPDATE, INSERT } = require('../constants/vocab')

const TERMS = {
  id: 'http://purl.org/dc/terms/',
  title: 'DCMI Metadata Terms - other',
  properties: {
    'http://purl.org/dc/terms/title': {
      id: 'http://purl.org/dc/terms/title'
    },
    'http://purl.org/dc/terms/date': {
      id: 'http://purl.org/dc/terms/date'
    }
  }
}

function init() {
  return async (dispatch) => {
    return dispatch(insert(TERMS))
  }
}

function persist() {
  return (_, getState) => {
    const { vocab } = getState()
    Storage.save('vocab', vocab)
  }
}

function restore() {
  return (dispatch) => {
    const vocab = Storage.load('vocab')
    dispatch(vocab ? update(vocab) : init())
  }
}

function update(payload) {
  return { type: UPDATE, payload }
}

function insert(payload) {
  return { type: INSERT, payload }
}

module.exports = {
  persist,
  restore,
  update
}
