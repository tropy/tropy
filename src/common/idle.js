'use strict'

const assert = require('assert')
const { getIdleTime } = require('desktop-idle')

const byTime = (a, b) =>
	(a.time < b.time) ? -1 : (a.time > b.time) ? 1 :
		(a.id < b.id) ? -1 : (a.id > b.id) ? 1 : 0


class IOQ {
  constructor({ precision } = {}) {
    this.precision = precision || IOQ.PRECISION
    this.observers = []
  }

  get isEmpty() {
    return this.observers.length === 0
  }

  getIdleTime() {
    return getIdleTime()
  }

  add(observe, time) {
    assert(time > this.precision, 'idle delay below precision')
    assert(typeof observe === 'function', 'missing idle observer')

    this.observers.push({ done: false, id: Date.now(), observe, time })
    this.observers.sort(byTime)
    return this
  }

  remove(observe, time) {
    let idx = this.observers.findIndex(o =>
      o.observe === observe && o.time === time)
    if (idx >= 0) this.observers.splice(idx, 1)
    return this
  }

  clear() {
    this.observers = []
    return this
  }

  resume() {
    if (this.pi == null) {
      let min = this.precision
      let cur
      let was = 0

      this.pi = setInterval(() => {
        cur = this.getIdleTime()
        if (cur < was) this.activate()
        if (cur >= min) this.idle(cur)
        was = Math.max(0, cur - min)
      }, min * 1000)
    }

    return this
  }

  pause() {
    if (this.pi != null) {
      this.pi = void clearInterval(this.pi)
      this.activate()
    }
    return this
  }

  activate() {
    for (let obs of this.observers) {
      if (obs.done) obs.observe(this, 'active', 0)
      obs.done = false
    }
  }

  idle(time) {
    for (let obs of this.observers) {
      if (time < obs.time) break
      if (obs.done) continue
      obs.observe(this, 'idle', time)
      obs.done = true
    }
  }
}

IOQ.PRECISION = 5
IOQ.global = new IOQ()


module.exports = {
  get idleTime() {
    return IOQ.global.getIdleTime() * 1000
  },

  addIdleObserver(...args) {
    IOQ.global.add(...args)
    IOQ.global.resume()
  },

  removeIdleObserver(...args) {
    IOQ.global.remove(...args)
    if (IOQ.global.isEmpty) IOQ.global.pause()
  },

  IOQ
}
