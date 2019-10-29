'use strict'

const { API, ITEM, METADATA, TAG } = require('../constants')
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
    create({ items, ...payload }, meta) {
      return {
        type: TAG.CREATE,
        payload: {
          ...payload,
          items: array(items)
        },
        meta: {
          cmd: 'project',
          history: 'add',
          search: true,
          ...meta
        }
      }
    },

    delete(payload, meta) {
      return {
        type: TAG.DELETE,
        payload,
        meta: {
          cmd: 'project',
          history: 'add',
          search: true,
          ...meta
        }
      }
    },

    add({ id, tags, ...payload }, meta) {
      return {
        type: ITEM.TAG.CREATE,
        payload: {
          id: array(id),
          tags: array(tags),
          ...payload
        },
        meta: {
          cmd: 'project',
          history: 'add',
          search: true,
          ...meta
        }
      }
    },

    clear({ id }, meta) {
      return {
        type: ITEM.TAG.CLEAR,
        payload: id,
        meta: {
          cmd: 'project',
          history: 'add',
          search: true,
          ...meta
        }
      }
    },

    find(payload, meta) {
      return {
        type: API.TAG.FIND,
        payload,
        meta: {
          cmd: 'project',
          ...meta
        }
      }
    },

    remove({ tags, ...payload  }, meta) {
      return {
        type: ITEM.TAG.DELETE,
        payload: {
          tags: array(tags),
          ...payload
        },
        meta: {
          cmd: 'project',
          history: 'add',
          search: true,
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
