'use strict'

const { ONTOLOGY } = require('../constants')
const { PROPS, CLASS, VOCAB } = ONTOLOGY
const { array } = require('../common/util')

module.exports = {
  import(payload = {}, meta) {
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
        payload: array(payload),
        meta: {
          cmd: 'ontology',
          history: 'add',
          ...meta
        }
      }
    },

    restore(payload, meta = {}) {
      return {
        type: VOCAB.RESTORE,
        payload,
        meta: {
          cmd: 'ontology',
          history: 'add',
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

  class: {
    load(payload, meta = {}) {
      return {
        type: CLASS.LOAD,
        payload,
        meta: {
          cmd: 'ontology',
          ...meta
        }
      }
    }
  }
}
