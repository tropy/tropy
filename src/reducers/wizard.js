'use strict'

const { WIZARD } = require('../constants')

const init = {
  project: { name: '', file: '' },
  userData: ARGS.documents
}

module.exports = {
  wizard(state = init, { type, payload }) {
    switch (type) {
      case WIZARD.PROJECT.UPDATE:
        return { ...state, project: { ...state.project, ...payload } }
      default:
        return state
    }
  }
}
