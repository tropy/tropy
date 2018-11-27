'use strict'

const { EDIT, LIST } = require('../constants')
const { get } = require('../common/util')

module.exports = {
  edit(state = {}, { type, payload }) {
    switch (type) {
      case EDIT.START:
        return { ...payload }
      case EDIT.CANCEL:
        return {}
      case LIST.INSERT:
        return get(state, ['list', 'parent']) === payload.parent ? {} : state
      case LIST.UPDATE:
        return get(state, ['list', 'id']) === payload.id ? {} : state
      default:
        return state
    }
  }
}
