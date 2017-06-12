'use strict'

const { combineReducers } = require('redux')
const { ONTOLOGY } = require('../constants')
const { PROPS, CLASS, VOCAB } = ONTOLOGY
const { load, insert, replace, remove } = require('./util')

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
    case VOCAB.DELETE:
      return (meta.done && !error) ? remove(state, payload) : state
    case VOCAB.RESTORE:
      return (meta.done && !error) ? insert(state, payload) : state
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
