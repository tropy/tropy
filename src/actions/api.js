'use strict'

const { API, ITEM } = require('../constants')
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
  }
}
