'use strict'

const B = require('bluebird')
const pad = require('string.prototype.padstart')
const { keys } = Object

module.exports = {

  once(emitter, event) {
    return new B((resolve, reject) => {
      const on =
        (emitter.on || emitter.addEventListener).bind(emitter)
      const off =
        (emitter.removeListener || emitter.removeEventListener).bind(emitter)

      function success(...args) {
        off(event, success)
        off('error', failure)

        resolve(...args)
      }

      function failure(...args) {
        off(event, success)
        off('error', failure)

        reject(...args)
      }

      on('error', failure)
      on(event, success)
    })
  },

  times(n, fn) {
    for (var i = 0, res = []; i < n; ++i) res.push(fn(i))
    return res
  },

  array(obj) {
    return obj == null ? [] : Array.isArray(obj) ? [...obj] : [obj]
  },

  splice(array, at, count = 0, ...items) {
    return [...array.slice(0, at), ...items, ...array.slice(at + count)]
  },

  sort(array, ...args) {
    return [...array].sort(...args)
  },

  uniq(array, into = [], memo = new Set()) {
    for (let item of array) {
      if (!memo.has(item)) {
        memo.add(item)
        into.push(item)
      }
    }

    return into
  },

  reverse(array) {
    const rev = []

    for (let i = array.length - 1; i >= 0; --i) {
      rev.push(array[i])
    }

    return rev
  },

  remap(array, fn) {
    const res = new Array(array.length)

    for (let i = array.length - 1; i >= 0; --i) {
      res[i] = fn(array[i], i)
    }

    return res
  },

  move(array, a, b, offset = 0) {
    if (a === b) return [...array]

    const res = []

    for (let i = 0, adj = 0; i < array.length; ++i) {
      let cur = array[i]

      if (cur === a) {
        --adj
        continue
      }

      if (cur === b) {
        res[i + adj + offset] = a
        ++adj
        res[i + adj - offset] = b
        continue
      }

      res[i + adj] = cur
    }

    return res
  },

  adjacent(array, item) {
    const i = array.indexOf(item)
    const n = array.length - 1

    switch (i) {
      case -1: return []
      case  0: return n ? [undefined, array[1]] : []
      case  n: return [array[n - 1]]
      default:
        return [array[i - 1], array[i + 1]]
    }
  },

  flatten(obj) {
    const res = {}

    function reduce(cur, prop = '') {
      if (Object(cur) !== cur) res[prop] = cur
      else for (let p in cur) reduce(cur[p], prop ? `${prop}.${p}` : p)

      return res
    }

    return reduce(obj)
  },

  get(src, path, value) {
    if (src == null) return value
    if (!path || !path.length) return src

    let parts = Array.isArray(path) ? path : path.split('.')
    let obj = src
    let i, ii

    for (i = 0, ii = parts.length; i < ii; ++i) {
      if (!obj.propertyIsEnumerable(parts[i])) {
        return value
      }

      obj = obj[parts[i]]

      if (obj == null) {
        return (i !== ii - 1) ? value : obj
      }
    }

    return obj
  },

  has(src, path) {
    if (src == null) return false
    if (!path || !path.length) return true

    let parts = Array.isArray(path) ? path : path.split('.')
    let obj = src
    let i, ii

    for (i = 0, ii = parts.length; i < ii; ++i) {
      if (!(parts[i] in obj)) return false
      obj = obj[parts[i]]
    }

    return true
  },

  pluck(src, props = [], into = []) {
    return props.reduce((res, key) => {
      const value = src[key]

      if (typeof value !== 'undefined' || src.hasOwnProperty(key)) {
        res.push(src[key])
      }

      return res

    }, into)
  },

  pick(src, props = [], into = {}) {
    return props.reduce((res, key) => {
      const value = src[key]

      if (typeof value !== 'undefined' || src.hasOwnProperty(key)) {
        res[key] = value
      }

      return res

    }, into)
  },

  omit(src, props = [], into = {}) {
    return module.exports.pick(src,
      // eslint-disable-next-line eqeqeq
      keys(src).filter(key => !props.find(prop => prop == key)), into)
  },

  merge(a, b) {
    const res = Object.assign({}, a)

    for (let prop in b) {
      if (b.hasOwnProperty(prop)) {
        let value = b[prop]
        let type = typeof value

        switch (true) {
          case type === 'number':
          case type === 'string':
          case type === 'undefined':
          case value == null:
            res[prop] = value
            break

          case Array.isArray(value):
            res[prop] = [...value]
            break

          case value instanceof Date:
            res[prop] = new Date(value)
            break

          default:
            res[prop] = module.exports.merge(res[prop], value)
            break
        }
      }
    }

    return res
  },

  map(src, fn, into = {}) {
    //if (typeof fn !== 'function') fn = () => fn

    for (let prop in src) {
      if (src.hasOwnProperty(prop)) {
        into[prop] = fn(prop, src[prop], src)
      }
    }

    return into
  },

  noop() {},

  identity(payload) { return payload },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  *counter(k = 0) {
    while (true) {
      k = Number.isSafeInteger(k) ? ++k : -k
      yield k
    }
  },

  round(value, digits = 100) {
    return Math.round(value * digits) / digits
  },

  titlecase(string) {
    return string.replace(/\b[a-z]/g, (match) => match.toUpperCase())
  },

  downcase(string) {
    return string.toLowerCase().replace(/\s+/g, '-')
  },

  quote(string, quotes = '""') {
    return `${quotes[0]}${string}${quotes[1]}`
  },

  diff(a, b) {
    const delta = []

    for (let prop in b) {
      if (a[prop] !== b[prop]) delta.push(prop)
    }

    for (let prop in a) {
      if (!(prop in b)) delta.push(prop)
    }

    return delta
  },

  strftime(format, date = new Date()) {
    return format.replace(/%([YymdHMS])/g, (match, code) => {
      switch (code) {
        case 'Y':
          return pad(date.getFullYear(), 4, '0')
        case 'y':
          return pad(date.getFullYear() % 100, 2, '0')
        case 'm':
          return pad(date.getMonth() + 1, 2, '0')
        case 'd':
          return pad(date.getDate(), 2, '0')
        case 'H':
          return pad(date.getHours(), 2, '0')
        case 'M':
          return pad(date.getMinutes(), 2, '0')
        case 'S':
          return pad(date.getSeconds(), 2, '0')
        default:
          return match
      }
    })
  },

  refine(context, method, refinement) {
    const original = context[method]

    context[method] = (...args) =>
      refinement.call(context, args, original.apply(context, args))
  },

  restrict(value, lower, upper) {
    value = Math.max(value, (lower != null) ? lower : value)
    value = Math.min(value, (upper != null) ? upper : value)
    return value
  },

  stringify(obj) {
    return obj == null ? null : JSON.stringify(obj)
  },

  json(string) {
    return (string == null || string === '') ? null : JSON.parse(string)
  }

}
