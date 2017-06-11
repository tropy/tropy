'use strict'

const { ONTOLOGY } = require('../constants')
const { PROPS, TYPES, VOCAB } = ONTOLOGY

module.exports = {
  import(payload, meta) {
    return {
      type: ONTOLOGY.IMPORT,
      payload,
      meta: {
        cmd: 'ontology',
        history: 'add',
        ...meta
      }
    }
  },

  vocab: {
    load(payload, meta = {}) {
      return {
        type: VOCAB.LOAD,
        payload,
        meta: {
          cmd: 'ontology',
          ...meta
        }
      }
    },

    delete(payload, meta = {}) {
      return {
        type: VOCAB.DELETE,
        payload,
        meta: {
          cmd: false, // 'ontology',
          history: false, // 'add',
          ...meta
        }
      }
    }
  },

  props: {
    load(payload, meta = {}) {
      return {
        type: PROPS.LOAD,
        payload,
        meta: {
          cmd: 'ontology',
          ...meta
        }
      }
    }
  },

  types: {
    load(payload, meta = {}) {
      return {
        type: TYPES.LOAD,
        payload,
        meta: {
          cmd: 'ontology',
          ...meta
        }
      }
    }
  }
}
