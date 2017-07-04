'use strict'

const { ONTOLOGY } = require('../constants')
const { PROPS, CLASS, VOCAB, TEMPLATE, LABEL } = ONTOLOGY
const { array } = require('../common/util')

module.exports = {
  import(payload = {}, meta) {
    return {
      type: ONTOLOGY.IMPORT,
      payload,
      meta: { cmd: 'ontology', history: 'add', ...meta }
    }
  },

  load(payload = {}, meta) {
    return {
      type: ONTOLOGY.LOAD,
      payload,
      meta: { cmd: 'ontology', ...meta }
    }
  },

  vocab: {
    load(payload, meta = {}) {
      return {
        type: VOCAB.LOAD,
        payload,
        meta: { cmd: 'ontology', ...meta }
      }
    },

    delete(payload, meta = {}) {
      return {
        type: VOCAB.DELETE,
        payload: array(payload),
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    },

    restore(payload, meta = {}) {
      return {
        type: VOCAB.RESTORE,
        payload,
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    },

    save(payload, meta = {}) {
      return {
        type: VOCAB.SAVE,
        payload,
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    }
  },

  props: {
    load(payload, meta = {}) {
      return {
        type: PROPS.LOAD,
        payload,
        meta: { cmd: 'ontology', ...meta }
      }
    },

    save(payload, meta = {}) {
      return {
        type: LABEL.SAVE,
        payload: { ...payload, type: 'props' },
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    }
  },

  class: {
    load(payload, meta = {}) {
      return {
        type: CLASS.LOAD,
        payload,
        meta: { cmd: 'ontology', ...meta }
      }
    },

    save(payload, meta = {}) {
      return {
        type: LABEL.SAVE,
        payload: { ...payload, type: 'class' },
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    }
  },

  template: {
    create(payload, meta = {}) {
      return {
        type: TEMPLATE.CREATE,
        payload,
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    },

    import(payload = {}, meta = {}) {
      return {
        type: TEMPLATE.IMPORT,
        payload,
        meta: { cmd: 'ontology', history: 'add', ...meta
        }
      }
    },

    delete(payload, meta = {}) {
      return {
        type: TEMPLATE.DELETE,
        payload,
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    },

    save(payload, meta = {}) {
      return {
        type: TEMPLATE.SAVE,
        payload,
        meta: { cmd: 'ontology', history: 'add', ...meta }
      }
    },

    load(payload, meta = {}) {
      return {
        type: TEMPLATE.LOAD,
        payload,
        meta: { cmd: 'ontology', ...meta }
      }
    },

    field: {
      add(payload, meta = {}) {
        return {
          type: TEMPLATE.FIELD.ADD,
          payload,
          meta: { cmd: 'ontology', ...meta }
        }
      },

      remove(payload, meta = {}) {
        return {
          type: TEMPLATE.FIELD.REMOVE,
          payload,
          meta: { cmd: 'ontology', ...meta }
        }
      },
    }
  }
}
