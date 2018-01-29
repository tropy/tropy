'use strict'

const { entries } = Object
const { isArray } = Array
const { pluck } = require('./util')

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
    this.reset()
    this.select(...args)
  }

  reset() {
    this.isNegated = false
    this.isDistinct = false
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

  join(other, { outer, using } = {}) {
    const join = outer ? 'LEFT OUTER JOIN' : 'JOIN'
    const cond = using ? ` USING (${using})` : ''
    this.src = [...this.src, `${join} ${other}${cond}`]
    return this
  }

  where(conditions) {
    try {
      this.parse(conditions)
      return this
    } finally {
      this.isNegated = false
    }
  }

  parse(input, {
    conditions = this.con,
    isNegated = this.isNegated,
    params = this.params
  } = {}) {
    if (typeof input === 'string') {
      conditions.push(input)

    } else {
      for (let lhs in input) {
        let rhs = input[lhs]
        let cmp

        switch (true) {
          case (rhs == null):
            rhs = 'NULL'
            cmp = isNegated ? 'IS NOT' : 'IS'
            break

          case (isArray(rhs)):
            rhs = `(${rhs.join(', ')})`
            cmp = isNegated ? 'NOT IN' : 'IN'
            break

          default:
            params[`$${lhs}`] = rhs
            rhs = `$${lhs}`
            cmp = isNegated ? '!=' : '='
        }

        conditions.push(`${lhs} ${cmp} ${rhs}`)
      }
    }

    return { conditions, params }
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
    try {
      this.parse(input, { conditions: this.hav })
      return this
    } finally {
      this.isNegated = false
    }
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
