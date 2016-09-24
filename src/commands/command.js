'use strict'

const { put } = require('redux-saga/effects')
const { tick } = require('../actions/history')
const { done } = require('../actions/activity')
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

      yield put(done(this.action))

      if (undo && this.action.meta.history) {
        yield put(tick({ undo, redo: this.action }))
      }

    } catch (error) {
      this.error = error

      yield put(done(this.action, error))
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
