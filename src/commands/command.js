'use strict'

const { pick } = require('../common/util')
const { freeze } = Object

class Command {
  constructor(action, options) {
    this.action = action
    this.options = options
    this.adjtime = 0
  }

  get duration() {
    return this.done ? this.done - this.init - this.adjtime : 0
  }

  get isomorph() {
    return !this.error && this.undo
  }

  suspend() {
    this._adjtime = Date.now()
  }

  resume() {
    this.adj += (Date.now() - this._adjtime)
    delete this._adjtime
  }

  *execute() {
    try {
      this.init = performance.now()
      this.result = yield this.exec()

    } catch (error) {
      this.error = error
      yield this.abort()

    } finally {
      this.done = performance.now()
      freeze(this)
    }

    return this
  }

  *abort() {
  }

  history() {
    return { undo: this.undo, redo: this.redo || this.action }
  }

  toJSON() {
    return pick(this, ['init', 'done', 'result', 'error', 'action'])
  }
}

module.exports = {
  Command
}
