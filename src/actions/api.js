'use strict'

const { API, ITEM, METADATA } = require('../constants')
const { array } = require('../common/util')

module.exports = {
  import({ files, ...payload }, meta) {
    return {
      type: ITEM.IMPORT,
      payload: {
        ...payload,
        files: array(files)
      },
      meta: {
        cmd: 'project',
        history: 'add',
        search: true,
        prompt: false,
        ...meta
      }
    }
  },

  item: {
    find({ tags, ...payload }, meta) {
      return {
        type: API.ITEM.FIND,
        payload: {
          ...payload,
          tags: array(tags)
        },
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    },

    show(payload, meta) {
      return {
        type: API.ITEM.SHOW,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    }
  },

  metadata: {
    save({ id, ...payload }, meta) {
      return {
        type: METADATA.SAVE,
        payload: {
          ids: array(id),
          ...payload
        },
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    },

    show(payload, meta) {
      return {
        type: API.METADATA.SHOW,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    }
  },

  note: {
    show(payload, meta) {
      return {
        type: API.NOTE.SHOW,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    }
  },

  photo: {
    find(payload, meta) {
      return {
        type: API.PHOTO.FIND,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    },

    show(payload, meta) {
      return {
        type: API.PHOTO.SHOW,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    }
  },

  tag: {
    list(payload, meta) {
      return {
        type: API.TAG.LIST,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    },

    show(payload, meta) {
      return {
        type: API.TAG.SHOW,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    }
  },

  selection: {
    show(payload, meta) {
      return {
        type: API.SELECTION.SHOW,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    }
  }
}
