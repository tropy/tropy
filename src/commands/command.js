'use strict'

const { put } = require('redux-saga/effects')
const { tick } = require('../actions/history')
const { freeze } = Object

class Command {

  constructor(db, action) {
    this.db = db
    this.action = action
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
      throw error

    } finally {
      this.done = performance.now()
      freeze(this)
    }
  }

  *abort() {
  }
}

module.exports = {
  Command
}
