'use strict'

const { combineReducers } = require('redux')
const { ONTOLOGY } = require('../constants')
const { PROPS, CLASS, VOCAB } = ONTOLOGY
const { load, replace } = require('./util')

function props(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.IMPORT:
      return (meta.done && !error) ? replace(state, payload.props) : state
    case PROPS.LOAD:
      return load(state, payload, meta, error)
    default:
      return state
  }
}

function klass(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.IMPORT:
      return (meta.done && !error) ? replace(state, payload.class) : state
    case CLASS.LOAD:
      return load(state, payload, meta, error)
    default:
      return state
  }
}

function vocab(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.IMPORT:
      return (meta.done && !error) ? replace(state, payload.vocab) : state
    case VOCAB.LOAD:
      return load(state, payload, meta, error)
    default:
      return state
  }
}

module.exports = {
  ontology: combineReducers({
    props,
    class: klass,
    vocab
  })
}
