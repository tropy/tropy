'use strict'

const { entries } = Object
const { isArray } = Array
const { copy, pluck } = require('./util')

class Query {
  dup() {
    return copy(this, new this.constructor())
  }

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
    this.reset()
    this.select(...args)
  }

  reset() {
    this.isDistinct = false
    this.isNegated = false
    this.isOuter = false
    this.params = {}
    this.cte = null
    this.col = {}
    this.src = []
    this.ord = []
    this.con = []
    this.grp = []
    this.hav = []
    return this
  }

  get distinct() {
    return (this.isDistinct = true), this
  }

  get all() {
    return (this.isDistinct = false), this
  }

  get not() {
    return (this.isNegated = true), this
  }

  get outer() {
    return (this.isOuter = true), this
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
    this.src = [...this.src, ...sources.join(', ')]
    return this
  }

  join(other, { using, on } = {}) {
    try {
      let JOIN = this.isOuter ? 'LEFT OUTER JOIN' : 'JOIN'
      let conditions = ''

      switch (true) {
        case (using != null):
          conditions = ` USING (${using})`
          break
        case (on != null):
          conditions = []
          this.parse(on, { conditions })
          conditions = ` ON (${conditions.join(' AND ')})`
          break
      }

      this.src = [...this.src, `${JOIN} ${other}${conditions}`]
      return this

    } finally {
      this.isOuter = false
    }
  }

  where(conditions) {
    return this.parse(conditions)
  }

  parse(input, { conditions = this.con, params = this.params } = {}) {
    try {
      if (typeof input === 'string') {
        conditions.push(input)
      } else {
        for (let lhs in input) {
          let rhs = input[lhs]
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
              params[`$${lhs}`] = rhs
              rhs = `$${lhs}`
              cmp = this.isNegated ? '!=' : '='
          }

          conditions.push(`${lhs} ${cmp} ${rhs}`)
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

  group(...by) {
    this.grp = [...this.grp, ...by]
    return this
  }

  having(input) {
    return this.parse(input, { conditions: this.hav })
  }

  with(head, body) {
    this.cte = { head, body }
    return this
  }

  get query() {
    return pluck(this, [
      'WITH',
      'SELECT',
      'FROM',
      'WHERE',
      'GROUP_BY',
      'HAVING',
      'ORDER'
    ]).join(' ')
  }

  get WITH() {
    return this.cte != null ?
      `WITH ${this.cte.head} AS (${this.cte.body})` : undefined
  }

  get SELECT() {
    return (
      `SELECT${this.isDistinct ? ' DISTINCT' : ''} ${
        entries(this.col)
          .map(([a, n]) => n === a ? n : `${n} AS ${a}`)
          .join(', ') || '*'
      }`
    )
  }

  get FROM() {
    return `FROM ${this.src.join(' ')}`
  }

  get WHERE() {
    return (this.con.length === 0) ?
      undefined : `WHERE ${this.con.join(' AND ')}`
  }

  get GROUP_BY() {
    return (this.grp.length === 0) ?
      undefined : `GROUP BY ${this.grp.join(', ')}`
  }

  get HAVING() {
    return (this.hav.length === 0) ?
      undefined : `HAVING ${this.hav.join(' AND ')}`
  }

  get ORDER() {
    return (this.ord.length === 0) ?
      undefined : `ORDER BY ${this.ord.join(', ')}`
  }
}

module.exports = {
  Query,
  Select,

  select(...args) { return new Select(...args) },
  union(...args) { return args.join(' UNION ') }
}
