'use strict'

const { combineReducers } = require('redux')
const { ONTOLOGY } = require('../constants')
const { PROPS, CLASS, VOCAB, LABEL, TEMPLATE } = ONTOLOGY
const { load, merge, replace, remove, update } = require('./util')

function props(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.LOAD:
    case ONTOLOGY.IMPORT:
      return (meta.done && !error) ?
        replace(state, payload.props) :
        state
    case PROPS.LOAD:
      return load(state, payload, meta, error)
    case LABEL.SAVE:
      return (payload.type === 'props' && meta.done && !error) ?
        update(state, { id: payload.id, label: payload.label }) :
        state
    default:
      return state
  }
}

function klass(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.LOAD:
    case ONTOLOGY.IMPORT:
      return (meta.done && !error) ?
        replace(state, payload.class) :
        state
    case CLASS.LOAD:
      return load(state, payload, meta, error)
    case LABEL.SAVE:
      return (payload.type === 'class' && meta.done && !error) ?
        update(state, { id: payload.id, label: payload.label }) :
        state
    default:
      return state
  }
}

// eslint-disable-next-line complexity
function vocab(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.LOAD:
    case ONTOLOGY.IMPORT:
      return (meta.done && !error) ?
        replace(state, payload.vocab) :
        state
    case VOCAB.LOAD:
      return load(state, payload, meta, error)
    case VOCAB.DELETE:
      return (meta.done && !error) ?
        remove(state, payload) :
        state
    case VOCAB.RESTORE:
      return (meta.done && !error) ?
        merge(state, payload) :
        state
    case VOCAB.SAVE:
      return (meta.done && !error) ?
        update(state, payload) :
        state
    default:
      return state
  }
}

// eslint-disable-next-line complexity
function template(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case TEMPLATE.IMPORT:
      return (meta.done && !error) ?
        replace(state, payload) :
        state
    case TEMPLATE.DELETE:
      return (meta.done && !error) ?
        remove(state, payload) :
        state
    case TEMPLATE.LOAD:
    case TEMPLATE.RESTORE:
      return (meta.done && !error) ?
        merge(state, payload) :
        state
    default:
      return state
  }
}

module.exports = {
  ontology: combineReducers({
    props,
    class: klass,
    template,
    vocab
  })
}
