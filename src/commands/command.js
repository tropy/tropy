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

  get reversible() {
    return this.undo && this.action.meta.history
  }

  *execute() {
    try {
      this.init = performance.now()

      this.result = yield this.exec()

      if (this.reversible) {
        yield put(tick({ undo: this.undo, redo: this.redo || this.action }))
      }

      return this

    } catch (error) {
      this.error = error
      yield this.abort()

    } finally {
      this.done = performance.now()
      freeze(this)
    }
  }

  *abort() {
  }

  toJSON() {
    return pick(this, ['init', 'done', 'error', 'action'])
  }
}

module.exports = {
  Command
}
