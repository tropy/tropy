import { combineReducers } from 'redux'
import { ONTOLOGY } from '../constants'
import { load, merge, nested, replace, remove, update } from './util'
import { has } from '../common/util'

const { PROPS, CLASS, VOCAB, LABEL, TEMPLATE, TYPE } = ONTOLOGY

function props(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.LOAD:
    case ONTOLOGY.IMPORT:
      return (meta.done && !error && has(payload, 'props')) ?
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
      return (meta.done && !error && has(payload, 'class')) ?
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

function datatype(state = {}, { type, payload, error, meta }) {
  switch (type) {
    case ONTOLOGY.LOAD:
    case ONTOLOGY.IMPORT:
      return (meta.done && !error && has(payload, 'type')) ?
        replace(state, payload.type) :
        state
    case TYPE.LOAD:
      return load(state, payload, meta, error)
    case LABEL.SAVE:
      return (payload.type === 'type' && meta.done && !error) ?
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
      return (meta.done && !error && has(payload, 'vocab')) ?
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
    case ONTOLOGY.LOAD:
      payload = payload.template
      // eslint-disable-line no-fallthrough
    case TEMPLATE.CREATE:
    case TEMPLATE.IMPORT:
    case TEMPLATE.LOAD:
      return (meta.done && !error) ?
        replace(state, payload) :
        state
    case TEMPLATE.SAVE:
      return (meta.done && !error) ?
        update(state, payload) :
        state
    case TEMPLATE.DELETE:
      return (meta.done && !error) ?
        remove(state, payload) :
        state
    case TEMPLATE.FIELD.ADD:
      return (meta.done && !error) ?
        nested.add('fields', state, payload, meta) :
        state
    case TEMPLATE.FIELD.REMOVE:
      return (meta.done && !error) ?
        nested.remove('fields', state, payload, meta) :
        state
    case TEMPLATE.FIELD.SAVE:
      if (meta.done && !error) {
        const { id, field } = payload

        return {
          ...state,
          [id]: {
            ...state[id],
            fields: state[id].fields.map(f => (
              f.id !== field.id ? f : { ...f, ...field }
            ))
          }
        }
      } else {
        return state
      }
    case TEMPLATE.FIELD.ORDER:
      if (meta.done && !error) {
        const { id, fields } = payload

        return {
          ...state,
          [id]: {
            ...state[id],
            fields: fields.map(fid => (
              state[id].fields.find(f => f.id === fid)
            ))
          }
        }
      } else {
        return state
      }
    default:
      return state
  }
}

export const ontology = combineReducers({
  props,
  class: klass,
  template,
  type: datatype,
  vocab
})
