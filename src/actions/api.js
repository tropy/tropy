'use strict'

const { ITEM } = require('../constants')
const { array } = require('../common/util')

module.exports = {
  project: {
    import({ files, ...payload }, meta) {
      return {
        type: ITEM.IMPORT,
        payload: {
          files: array(files),
          ...payload
        },
        meta: {
          api: true,
          cmd: 'project',
          history: 'add',
          search: true,
          prompt: false,
          ...meta
        }
      }
    }
  }
}
