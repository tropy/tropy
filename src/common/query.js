'use strict'

const { entries } = Object

class Query {
  constructor(params = {}) {
    this.params = params
  }

  get hasParams() {
    return Reflect.ownKeys(this.params).length > 0
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
    this.src = []
    this.select(...args)
  }

  distinct() {
    this.isDistinct = true
    return this
  }

  select(...args) {
    for (let columns of args) {
      if (typeof columns === 'string') {
        this.col = { ...this.col, [columns]: columns }
        continue
      }

      this.col = { ...this.col, ...columns }
    }

    return this
  }

  from() {
    return this
  }

  where() {
    return this
  }

  order() {
    return this
  }

  get query() {
    const { SELECT, columns } = this

    return `${SELECT} ${columns}`
  }

  get SELECT() {
    return this.isDistinct ? 'SELECT DISTINCT' : 'SELECT'
  }

  get columns() {
    return entries(this.col)
      .map(([name, alias]) => name === alias ? name : `${name} AS ${alias}`)
      .join(', ')
  }
}

module.exports = {
  Query,
  Select,

  select(...args) { return new Select(...args) }
}
