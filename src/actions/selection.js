'use strict'

const { SELECTION } = require('../constants')
const { array } = require('../common/util')

module.exports = {
  create(payload, meta) {
    return {
      type: SELECTION.CREATE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  delete(payload, meta) {
    return {
      type: SELECTION.DELETE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  load(payload, meta) {
    return {
      type: SELECTION.LOAD,
      payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  },

  notes: {
    add(payload, meta = {}) {
      return { type: SELECTION.NOTE.ADD, payload, meta }
    },

    remove(payload, meta = {}) {
      return { type: SELECTION.NOTE.REMOVE, payload, meta }
    }
  },

  order(payload, meta) {
    return {
      type: SELECTION.ORDER,
      payload,
      meta: {
        cmd: 'project',
        history: 'merge',
        ...meta
      }
    }
  },

  restore(payload, meta) {
    return {
      type: SELECTION.RESTORE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  save(payload, meta) {
    return {
      type: SELECTION.SAVE,
      payload,
      meta: { cmd: 'project', history: 'merge', ...meta }
    }
  },

  bulk: {
    update(payload, meta = {}) {
      return {
        type: SELECTION.BULK.UPDATE,
        payload,
        meta
      }
    }
  },

  template: {
    change({ id, template }, meta) {
      return {
        type: SELECTION.TEMPLATE.CHANGE,
        payload: {
          id: array(id),
          property: 'template',
          value: template
        },
        meta: {
          cmd: 'project',
          history: 'add',
          ...meta
        }
      }
    }
  },

  subject: {
    save({ id, type }) {
      return {
        type: SELECTION.SUBJECT.SAVE,
        payload: {
          id: array(id),
          property: 'rdf:type',
          value: type
        }
      }
    }
  }
}
