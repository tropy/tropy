'use strict'

const { put } = require('redux-saga/effects')
const { tick } = require('../actions/history')
const { pick } = require('../common/util')
const { freeze } = Object

class Command {
  constructor(action, options) {
    this.action = action
    this.options = options
  }

  get duration() {
    return this.done ? this.done - this.init : 0
  }

  *execute() {
    try {
      this.init = performance.now()

      const undo = yield this.exec()

      if (undo && this.action.meta.history) {
        yield put(tick({ undo, redo: this.action }))
      }

    } catch (error) {
      this.error = error

      yield this.abort()
      yield put({
        type: this.action.type,
        error,
        meta: { rel: this.action.meta.seq }
      })

    } finally {
      this.done = performance.now()
      freeze(this)
    }
  }

  *abort() {
  }

  toJSON() {
    return pick(this, ['name', 'init', 'done', 'error', 'action'])
  }
}

module.exports = {
  Command
}
