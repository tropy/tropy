'use strict'

const B = require('bluebird')
const pad = require('string.prototype.padstart')
const shortid = require('shortid')
const { keys } = Object

const util = {
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

  empty(obj) {
    return obj == null || keys(obj).length === 0
  },

  times(n, fn) {
    for (var i = 0, res = []; i < n; ++i) res.push(fn(i))
    return res
  },

  array(obj) {
    return obj == null ? [] : Array.isArray(obj) ? [...obj] : [obj]
  },

  splice(array, at, count = 0, ...items) {
    if (at == null) at = array.length

    return [
      ...array.slice(0, at),
      ...items,
      ...array.slice(at + count)
    ]
  },

  insert(array, at, ...items) {
    return util.splice(array, at, 0, ...items)
  },

  last(array) {
    return array[array.length - 1]
  },

  remove(array, ...items) {
    return array.filter(it => items.indexOf(it) < 0)
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

  homogenize(fn, memo = new Set()) {
    let test = x => memo.has(x) ? false : !!memo.add(x)
    return fn(test, memo)
  },

  compact(array) {
    return array.filter(util.exist)
  },

  exist(obj) {
    return obj != null
  },

  mixed(array) {
    for (let i = 1; i < array.length; ++i) {
      if (array[i] !== array[i - 1]) return true
    }

    return false
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
    if (a === b) return array

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

  warp(array, idx, at) {
    at = util.restrict(at, 0, array.length - 1)
    if (idx === at || idx == null) return array
    return util.insert(util.splice(array, idx, 1), at, array[idx])
  },

  swap(array, from, to) {
    to = util.restrict(to, 0, array.length - 1)

    if (from === to || from == null) return array
    if (from > to) return util.swap(array, to, from)

    let head = array.slice(0, from)
    let between = array.slice(from + 1, to)
    let tail = array.slice(to + 1)

    return [
      ...head, array[to], ...between, array[from], ...tail
    ]
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

  set(src, path, value) {
    if (typeof path === 'string') {
      return util.set(src, path.split('.'), value)
    }

    if (path.length === 0) return src
    if (path.length === 1) {
      return Object.assign({}, src, { [path[0]]: value })
    }

    return Object.assign({}, src, {
      [path[0]]: util.set(src[path[0]] || {}, path.slice(1), value)
    })
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

  pluck(src, props = [], into = [], expand = false) {
    return props.reduce((res, key) => {
      const value = src[key]

      if (expand || typeof value !== 'undefined' || src.hasOwnProperty(key)) {
        res.push(src[key])
      }

      return res

    }, into)
  },

  any(src, ...props) {
    for (let prop of props) {
      if (src.hasOwnProperty(prop)) return src[prop]
      if (typeof src[prop] !== 'undefined') return src[prop]
    }
  },

  pick(src, props = [], into = {}, expand = false) {
    return (src == null) ?
      into :
      props.reduce((res, key) => {
        const value = src[key]

        if (expand || typeof value !== 'undefined' || src.hasOwnProperty(key)) {
          res[key] = value
        }

        return res

      }, into)
  },

  omit(src, props = [], into = {}) {
    return util.pick(src,
      // eslint-disable-next-line eqeqeq
      keys(src).filter(key => !props.find(prop => prop == key)), into)
  },

  merge(a, b, into = {}) {
    if (a !== into) Object.assign(into, a)

    for (let prop in b) {
      if (b.hasOwnProperty(prop)) {
        let value = b[prop]
        let type = typeof value

        switch (true) {
          case type === 'boolean':
          case type === 'number':
          case type === 'string':
          case type === 'undefined':
          case value == null:
            into[prop] = value
            break
          case Array.isArray(value):
            into[prop] = [...value]
            break
          case value instanceof Date:
            into[prop] = new Date(value)
            break
          default:
            into[prop] = util.merge(into[prop], value)
            break
        }
      }
    }

    return into
  },

  copy(obj, into = {}) {
    return util.merge(into, obj, into)
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

  titlecase(string) {
    return string.replace(/\b[a-z]/g, (match) => match.toUpperCase())
  },

  downcase(string) {
    return string.toLowerCase().replace(/\s+/g, '-')
  },

  camelcase(str) {
    return str.replace(
        /(?:^\w|[A-Z]|\b\w|\s+)/g,
      (match, index) => {
        if (+match === 0) return ''
        return index === 0 ? match.toLowerCase() : match.toUpperCase()
      })
  },

  quote(string) {
    return `"${string.replace(/\\"/, 'g')}"`
  },

  list(params, fn = Number, comma = ',') {
    return params.map(fn).join(comma)
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
  },

  toId(obj) {
    return obj.id
  },

  blank(string) {
    return string == null || string.length === 0
  },

  identify() {
    return shortid.generate()
  },

  shallow(a, b, props) {
    if (a === b) return true
    if (a == null || b == null) return false

    if (util.blank(props)) props = keys(a)

    for (let prop of props) {
      if (a[prop] !== b[prop]) return false
    }

    return true
  },

  groupBy(array, key) {
    return array.reduce((acc, obj) => {
      acc[obj[key]] = acc[obj[key]] || []
      acc[obj[key]].push(obj)
      return acc
    }, {})
  }
}

module.exports = util
