import { copy, pluck } from './util'

const { assign, entries } = Object
const { isArray } = Array

export class Query {
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

export class Insert extends Query {
  constructor(table) {
    super()
    this.table = table
    this.columns = []
    this.values = []
  }

  *[Symbol.iterator]() {
    yield this.query
    yield this.values
  }

  insert(input) {
    for (let col in input) {
      this.columns.push(col)
      this.values.push(input[col])
    }
    return this
  }

  get query() {
    return [this.INSERT, this.VALUES].join(' ')
  }

  get INSERT() {
    return `INSERT INTO ${this.table} (${this.columns.join(', ')})`
  }

  get VALUES() {
    return `VALUES (${this.values.map(() => '?').join(',')})`
  }
}

export class Union extends Query {
  constructor(...args) {
    super()
    this.params = {}
    this.set = []
    this.push(...args)
  }

  get query() {
    return this.set.join(' UNION ')
  }

  push(...args) {
    for (const { query, params } of args) {
      this.set.push(query)
      this.params = { ...this.params, ...params }
    }
  }
}

class ConditionalQuery extends Query {
  constructor() {
    super()
    this.reset()
  }

  reset() {
    this.isNegated = false
    this.params = {}
    this.con = []
    return this
  }

  get not() {
    return (this.isNegated = true), this
  }

  where(conditions) {
    return this.parse(conditions)
  }

  parse(input, {
    conditions = this.con,
    filters = {},
    forAssignment = false,
    params = this.params,
    prefix = ''
  } = {}) {
    try {
      if (typeof input === 'string') {
        conditions.push(input)
      } else {
        for (let lhs in input) {
          let cmp
          let rhs = input[lhs]

          if (rhs === undefined) continue

          switch (true) {
            case (rhs === null):
              rhs = 'NULL'
              cmp = forAssignment ? '=' : this.isNegated ? 'IS NOT' : 'IS'
              break

            case (isArray(rhs)):
              rhs = `(${rhs.join(', ')})`
              cmp = this.isNegated ? 'NOT IN' : 'IN'
              break

            case (rhs instanceof Query):
              assign(params, rhs.params)
              rhs = rhs.query
              cmp = this.isNegated ? 'NOT IN' : 'IN'
              break

            default:
              params[`$${prefix}${lhs}`] = rhs
              rhs = `$${prefix}${lhs}`
              cmp = this.isNegated ? '!=' : '='
          }

          conditions.push(`${lhs} ${cmp} ${
            (lhs in filters) ? filters[lhs](rhs) : rhs
          }`)
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

  get WHERE() {
    return (this.con.length === 0) ?
      undefined : `WHERE ${this.con.join(' AND ')}`
  }
}

export class Select extends ConditionalQuery {
  constructor(...args) {
    super()
    this.select(...args)
  }

  reset() {
    super.reset()
    this.isDistinct = false
    this.isOuter = false
    this.cte = null
    this.col = {}
    this.src = []
    this.ord = []
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
    this.src = [...this.src, sources.join(', ')]
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

  limit(limit) {
    this.lmt = Number(limit)
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
      'ORDER',
      'LIMIT'
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

  get LIMIT() {
    return (!this.lmt) ?
      undefined : `LIMIT ${this.lmt}`
  }
}


export class Update extends ConditionalQuery {
  constructor(src) {
    super()
    this.src = src
  }

  reset() {
    super.reset()
    this.asg = []
    return this
  }

  set(assignments, opts = {}) {
    return this.parse(assignments, {
      forAssignment: true,
      conditions: this.asg,
      prefix: 'new_',
      ...opts
    })
  }

  get query() {
    return pluck(this, ['UPDATE', 'SET', 'WHERE']).join(' ')
  }

  get UPDATE() {
    return `UPDATE ${this.src}`
  }

  get SET() {
    return `SET ${this.asg.join(', ')}`
  }
}

export function into(...args) {
  return new Insert(...args)
}

export function select(...args) {
  return new Select(...args)
}

export function union(...args) {
  return new Union(...args)
}

export function update(...args) {
  return new Update(...args)
}
