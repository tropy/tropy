import assert from 'assert'
import { call, cancelled, put } from 'redux-saga/effects'
import * as activity from '../slices/activities.js'
import { parallel } from '../sagas/util.js'
import { warn } from '../common/log.js'

export const Registry = new Map()

/*
 * Commands run once, via the *exec saga.
 * They succeed or fail on their own;
 * cancellation only ever comes from outside.
 *
 * Failures: errors propagate out of exec(),
 * they should only be caught if the command handles them.
 * Otherwise, the *exec saga is the single place that:
 * logs the error, reports it with the done action,
 * and, unless `meta.silent`, shows the generic error dialog.
 *
 * Use addError() for partial failures.
 *
 * Cancellation: no catch block runs, only finally blocks.
 * The *abort() hook is only for errors.
 */

export class Command {
  #total = 0
  #progress = 0

  errors = []
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

    } catch (error) {
      this.error = error
      yield this.abort()

    } finally {
      if (yield cancelled())
        this.cancelled = true
    }

    return this
  }

  finalize (action) {
    this.done = action
    return Object.freeze(this)
  }

  addError (err, message = `${this} failed in part`) {
    warn({ err }, message)
    this.errors.push(err)
  }

  *parallel (items, proc) {
    yield this.progress({ total: items.length })

    let { meta } = this.action
    let self = this

    let concurrency = meta.concurrency || Infinity

    yield parallel(items, function* (item) {
      try {
        yield self.progress()
        yield proc(item, self)
      } catch (err) {
        self.addError(err)
      }
    }, { concurrency })
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
