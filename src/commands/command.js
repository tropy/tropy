'use strict'

const { pick } = require('../common/util')
const { freeze } = Object

class Command {
  #adjtime = 0
  #suspended

  constructor(action, options) {
    this.action = action
    this.options = { ...options }
  }

  get duration() {
    return this.done ?
      (this.done - this.init - this.#adjtime) : 0
  }

  get isomorph() {
    return this.done && this.error == null && this.undo != null
  }

  suspend() {
    this.#suspended = Date.now()
  }

  resume() {
    this.#adjtime += (Date.now() - this.#suspended)
  }

  *execute() {
    try {
      this.init = Date.now()
      this.result = yield this.exec()
      var hasRunToCompletion = true

    } catch (error) {
      this.error = error
      yield this.abort()

    } finally {
      this.cancelled = !!hasRunToCompletion
      this.done = Date.now()
      yield this.finally()
    }

    freeze(this)
    return this
  }

  *abort() {
  }

  *finally() {
  }

  history() {
    return {
      undo: this.undo,
      redo: this.redo || this.action
    }
  }

  toJSON() {
    return pick(this, [
      'action',
      'done',
      'error',
      'init',
      'result'
    ])
  }
}

module.exports = {
  Command
}
