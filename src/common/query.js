'use strict'

const { entries } = Object
const { isArray } = Array
const { pluck, list } = require('./util')

class Query {
  get hasParams() {
    return this.params != null && Reflect.ownKeys(this.params).length > 0
  }

  *[Symbol.iterator]() {
    yield this.toString()

    if (this.hasParams) {
      yield this.params
    }
  }

  get query() {
    throw new Error('not implemented')
  }

  toString() {
    return this.query
  }
}

class Select extends Query {
  constructor(...args) {
    super()

    this.isNegated = false
    this.isDistinct = false

    this.col = {}
    this.src = []
    this.ord = []
    this.con = []

    this.select(...args)
  }

  get distinct() {
    this.isDistinct = true
    return this
  }

  get all() {
    this.isDistinct = false
    return this
  }

  get not() {
    this.isNegated = true
    return this
  }

  select(...columns) {
    for (let cols of columns) {
      if (typeof cols === 'string') {
        this.col = { ...this.col, [cols]: cols }
        continue
      }

      this.col = { ...this.col, ...cols }
    }

    return this
  }

  from(...sources) {
    this.src = [...this.src, ...sources]
    return this
  }

  where(conditions) {
    try {
      if (typeof conditions === 'string') {
        this.con.push(conditions)

      } else {
        for (let lhs in conditions) {
          let rhs = conditions[lhs]
          let cmp

          switch (true) {
            case (rhs == null):
              rhs = 'NULL'
              cmp = this.isNegated ? 'IS NOT' : 'IS'
              break

            case (isArray(rhs)):
              rhs = `(${rhs.join(', ')})`
              cmp = this.isNegated ? 'NOT IN' : 'IN'
              break

            default:
              this.params[`$${lhs}`] = rhs
              rhs = `$${lhs}`
              cmp = this.isNegated ? '!=' : '='
          }

          this.con.push(`${lhs} ${cmp} ${rhs}`)
        }
      }

      return this

    } finally {
      this.isNegated = false
    }
  }

  unless(...args) {
    return this.not.where(...args)
  }

  order(by, dir) {
    this.ord = [...this.ord, `${by}${dir ? ` ${dir}` : ''}`]
    return this
  }

  with(head, body) {
    this.cte = { head, body }
    return this
  }

  get query() {
    return pluck(this, ['WITH', 'SELECT', 'FROM', 'WHERE', 'ORDER']).join(' ')
  }

  get WITH() {
    return this.cte != null ?
      `WITH ${this.cte.head} AS (${this.cte.body})` : undefined
  }

  get SELECT() {
    return (
      `SELECT${this.isDistinct ? ' DISTINCT' : ''} ${
        entries(this.col)
          .map(([n, a]) => n === a ? n : `${n} AS ${a}`)
          .join(', ') || '*'
      }`
    )
  }

  get FROM() {
    return `FROM ${this.src.join(', ')}`
  }

  get WHERE() {
    return (this.con.length === 0) ?
      undefined : `WHERE ${this.con.join(' AND ')}`
  }

  get ORDER() {
    return (this.ord.length === 0) ?
      undefined : `ORDER BY ${this.ord.join(', ')}`
  }
}

module.exports = {
  Query,
  Select,

  select(...args) { return new Select(...args) }
}
