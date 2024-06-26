import assert from 'assert'
import { cancel, put } from 'redux-saga/effects'
import activity from '../actions/activity.js'
import { pick } from '../common/util.js'
import { parallel } from '../sagas/util.js'

export const Registry = new Map()

export class Command {
  #adjtime = 0
  #suspended

  #total = 0
  #progress = 0

  constructor(action, options = {}) {
    this.action = action
    this.options = options
  }

  get duration() {
    return this.done ?
        (this.done - this.init - this.#adjtime) : 0
  }

  get id() {
    return this.action.meta.seq
  }

  get isReversible() {
    return !this.error && !!this.undo && !!this.action.meta.history
  }

  get history() {
    return {
      undo: this.undo,
      redo: this.redo || this.action,
      mode: this.action.meta.history
    }
  }

  get type() {
    return this.action.type
  }

  suspend() {
    this.#suspended = Date.now()
  }

  resume() {
    this.#adjtime += (Date.now() - this.#suspended)
  }

  run = function* () {
    try {
      this.init = Date.now()
      this.result = yield this.exec()
      var hasRunToCompletion = true

    } catch (error) {
      this.error = error

      yield this.abort()
      yield cancel()

    } finally {
      this.cancelled = !hasRunToCompletion

      yield this.finally()

      this.done = Date.now()
      Object.freeze(this)
    }

    return this
  };

  *parallel(items, proc) {
    yield this.progress({ total: items.length })

    let { meta } = this.action
    let self = this

    let errors = []
    let concurrency = meta.concurrency || Infinity

    yield parallel(items, function* (item) {
      try {
        yield self.progress()
        yield proc(item, self)
      } catch (e) {
        errors.push(e)
      }
    }, { concurrency })

    if (errors.length > 0)
      throw new AggregateError(errors, 'too many errors')
  }

  *progress({ total, progress = 1 } = {}) {
    if (total !== undefined)
      this.#total += total
    else
      this.#progress += progress

    yield put(activity.update(this.action, {
      total: this.#total,
      progress: this.#progress
    }))

    return this.#progress
  }

  *abort() {
  }

  *finally() {
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

  toString() {
    return `${this.type}#${this.id}`
  }

  static create(action, options) {
    return new (Registry.get(action.type))(action, { ...options })
  }

  static register(type, Cmd = this) {
    if (typeof type === 'function') type = type.type

    assert(type, 'missing action type')
    assert(Cmd.prototype instanceof Command || Cmd === Command)

    assert(!Registry.has(type), `command ${type} already registered!`)

    Registry.set(type, Cmd)
  }
}
