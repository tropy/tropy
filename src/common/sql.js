const { entries } = Object
const { isArray } = Array

export class Sql {
  constructor (text = '', params = []) {
    this.text = text
    this.params = params
  }
}

// Tagged template binding every interpolated value:
// scalars become `?`, arrays one `?` bound as JSON text
// (for json_each: one SQL text for any list length),
// and Sql fragments are spliced in with their parameters.
// Identifiers must be passed explicitly via sql.id or sql.raw.
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

// A json_each subquery for `IN`, e.g. sql`WHERE id IN ${sql.list(ids)}`.
// Values come back with JSON types and no column affinity:
// numbers never equal text, so pass ids as stored.
sql.list = (values) =>
  sql`(SELECT value FROM json_each(${values}))`

sql.raw = (text) =>
  new Sql(text)

sql.id = (name) =>
  new Sql(`"${String(name).replaceAll('"', '""')}"`)

// Assignments for the defined properties of data,
// e.g. sql`UPDATE tags SET ${sql.set(data)} WHERE tag_id = ${id}`.
sql.set = (data) => {
  let pairs = defined(data)

  return new Sql(
    pairs.map(([name]) => `${sql.id(name).text} = ?`).join(', '),
    pairs.map(([, value]) => value))
}

// Columns and values for the defined properties of data,
// e.g. sql`INSERT INTO tags ${sql.values(data)}`.
sql.values = (data) => {
  let pairs = defined(data)

  return new Sql(
    `(${pairs.map(([name]) => sql.id(name).text).join(', ')}) VALUES (${
      pairs.map(() => '?').join(', ')
    })`,
    pairs.map(([, value]) => value))
}

function defined (data) {
  return entries(data).filter(([, value]) => value !== undefined)
}
