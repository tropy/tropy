import assert from 'assert'
import { call, cancel, cancelled, put } from 'redux-saga/effects'
import * as activity from '../slices/activities.js'
import { parallel } from '../sagas/util.js'

export const Registry = new Map()

export class Command {
  #total = 0
  #progress = 0

  suspended = 0

  constructor (action, options = {}) {
    this.action = action
    this.options = options
  }

  get init () {
    return this.action.meta.now
  }

  get duration () {
    return this.done
      ? (this.done.meta.now - this.init)
      : undefined
  }

  get id () {
    return this.action.meta.seq
  }

  get isReversible () {
    return !this.error && !!this.undo && !!this.action.meta.history
  }

  get history () {
    return {
      undo: this.undo,
      redo: this.redo || this.action,
      mode: this.action.meta.history
    }
  }

  get type () {
    return this.action.type
  }

  *suspend () {
    if (this.suspended++ > 0)
      return

    yield put(activity.suspend(this.action))
  }

  *resume () {
    if (--this.suspended > 0)
      return

    yield put(activity.resume(this.action))
  }

  dialog (fn, ...args) {
    return call([this, this.showDialog], fn, ...args)
  }

  // Shows a dialog using the dialog function `fn`
  // Subtle: assumes dialog functions take options as last argument!
  *showDialog (fn, ...args) {
    let ctrl = new AbortController()
    let opts = args.at(-1)

    if (opts != null && typeof opts === 'object')
      args[args.length - 1] = { ...opts, signal: ctrl.signal }
    else
      args.push({ signal: ctrl.signal })

    try {
      yield * this.suspend()
      return yield call(fn, ...args)

    } finally {
      if (yield cancelled())
        ctrl.abort()

      yield * this.resume()
    }
  }

  *run () {
    try {
      this.result = yield this.exec()
      var hasRunToCompletion = true

    } catch (error) {
      this.error = error

      yield this.abort()
      yield cancel()

    } finally {
      this.cancelled = !hasRunToCompletion
    }

    return this
  }

  // Stores the dispatched action that finished the command.
  finalize (action) {
    this.done = action
    return Object.freeze(this)
  }

  *parallel (items, proc) {
    yield this.progress({ total: items.length })

    let { meta } = this.action
    let self = this

    let errors = []
    let concurrency = meta.concurrency || Infinity

    yield parallel(items, function* (item) {
      try {
        yield self.progress()
        yield proc(item, self)
      } catch (err) {
        errors.push(err)
      }
    }, { concurrency })

    if (errors.length > 0)
      throw new AggregateError(errors, 'too many errors')
  }

  *progress ({ total, progress = 1 } = {}) {
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

  *abort () {
  }

  toString () {
    return `${this.type}#${this.id}`
  }

  static create (action, options) {
    assert(Registry.has(action.type), `unknown command ${action.type}`)
    return new (Registry.get(action.type))(action, { ...options })
  }

  static fail (action, error) {
    let cmd = new this(action)
    cmd.error = error
    return cmd
  }

  static register (type, Cmd = this) {
    if (typeof type === 'function') type = type.type

    assert(type, 'missing action type')
    assert(Cmd.prototype instanceof Command || Cmd === Command)

    assert(!Registry.has(type), `command ${type} already registered!`)

    Registry.set(type, Cmd)
  }
}
