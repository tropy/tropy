'use strict'

const { combineReducers } = require('redux')
const { ONTOLOGY } = require('../constants')
const { PROPS, TYPES, VOCAB } = ONTOLOGY
const { load } = require('./util')

function props(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case PROPS.LOAD:
      return load(state, payload, meta, error)
    default:
      return state
  }
}

function types(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case TYPES.LOAD:
      return load(state, payload, meta, error)
    default:
      return state
  }
}

function vocab(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case VOCAB.LOAD:
      return load(state, payload, meta, error)
    default:
      return state
  }
}

module.exports = {
  ontology: combineReducers({
    props,
    types,
    vocab
  })
}
