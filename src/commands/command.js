'use strict'

const { pick } = require('../common/util')
const { freeze } = Object

class Command {
  constructor(action, options) {
    this.action = action
    this.options = { ...options }
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
    let wasCancelled = true

    try {
      this.init = performance.now()
      this.result = yield this.exec()
      wasCancelled = false

    } catch (error) {
      this.error = error
      yield this.abort()

    } finally {
      this.done = performance.now()
      if (wasCancelled) this.onCancel()
      freeze(this)
    }

    return this
  }

  *abort() {
  }

  onCancel() {
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
