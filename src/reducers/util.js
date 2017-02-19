'use strict'

const { splice } = require('../common/util')

module.exports = {
  nested: {
    add(name, state = {}, payload, { idx }) {
      const { id, [name]: added } = payload

      if (idx == null || idx < 0) idx = state[id][name].length

      return {
        ...state,
        [id]: {
          ...state[id],
          [name]: splice(state[id][name], idx, 0, ...added)
        }
      }
    },

    remove(name, state = {}, payload) {
      const { id, [name]: removed } = payload

      return {
        ...state,
        [id]: {
          ...state[id],
          [name]: state[id][name].filter(x => !removed.includes(x))
        }
      }
    }
  }
}
