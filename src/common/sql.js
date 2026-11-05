import assert from 'node:assert'

const { entries } = Object
const { isArray } = Array

export class Sql {
  constructor (text = '', params = []) {
    this.text = text
    this.params = params
  }
}

export function sql (strings, ...values) {
  let text = strings[0]
  let params = []

  for (let i = 0; i < values.length; ++i) {
    let value = values[i]

    if (value instanceof Sql) {
      text += value.text
      params.push(...value.params)
    } else {
      text += '?'
      params.push(isArray(value) ? JSON.stringify(value) : value ?? null)
    }

    text += strings[i + 1]
  }

  return new Sql(text, params)
}

sql.list = (values) =>
  sql`(SELECT value FROM json_each(${values}))`

export const IN = (values) =>
  sql`IN ${sql.list(values)}`

sql.raw = (text) =>
  new Sql(text)

sql.id = (name) =>
  new Sql(`"${String(name).replaceAll('"', '""')}"`)

export const SET = (data) =>
  sql`SET ${join(defined(data).map(([name, value]) =>
    sql`${sql.id(name)} = ${value}`))}`

export const VALUES = (data) => {
  let pairs = defined(data)

  return sql`(${join(pairs.map(([name]) => sql.id(name)))}) VALUES (${
    join(pairs.map(([, value]) => sql`${value}`))
  })`
}

sql.IN = IN
sql.SET = SET
sql.VALUES = VALUES

export default sql

function defined (data) {
  let pairs = entries(data).filter(([, value]) => value !== undefined)
  assert(pairs.length > 0, 'no defined properties')
  return pairs
}

function join (fragments) {
  return fragments.reduce((a, b) => sql`${a}, ${b}`)
}
