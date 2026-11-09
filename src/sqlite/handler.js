import Database from 'better-sqlite3'

const BATCH = 1000

export class Handler {
  #db
  #statements = new Map()
  #totalChanges

  // Cached only once prepared: a statement may fail now
  // (e.g. no such table) and succeed after a schema change.
  #statement (sql) {
    let stmt = this.#statements.get(sql)

    if (stmt == null) {
      stmt = this.#db.prepare(sql)
      this.#statements.set(sql, stmt)
    }

    return stmt
  }

  #call (sql, fn) {
    let stmt = this.#statement(sql)
    return { value: fn(stmt), changed: !stmt.readonly }
  }

  handle (op, { sql, values = [], path, options, flag }, send) {
    switch (op) {
      case 'open':
        this.#db = new Database(path, options)
        this.#totalChanges = this.#db.prepare('SELECT total_changes()').pluck()
        return {}

      case 'unsafeMode':
        this.#db.unsafeMode(flag)
        return {}

      case 'all':
        return this.#call(sql, stmt =>
          stmt.reader ? stmt.all(...values) : (stmt.run(...values), []))

      case 'get':
        return this.#call(sql, stmt =>
          stmt.reader ? stmt.get(...values) : void stmt.run(...values))

      case 'ids':
        return this.#call(sql, stmt => {
          try {
            return Int32Array.from(stmt.pluck(true).all(...values))
          } finally {
            stmt.pluck(false)
          }
        })

      case 'run':
        return this.#call(sql, stmt => {
          let { changes, lastInsertRowid } = stmt.run(...values)
          return { id: Number(lastInsertRowid), changes }
        })

      case 'each':
        return this.#call(sql, stmt => {
          let batch = []

          for (let row of stmt.iterate(...values)) {
            batch.push(row)

            if (batch.length === BATCH) {
              send(batch)
              batch = []
            }
          }

          if (batch.length > 0)
            send(batch)
        })

      // Statements before a failing one may have changed rows.
      case 'exec': {
        let before = this.#totalChanges.get()
        let changed = () => this.#totalChanges.get() !== before

        try {
          this.#db.exec(sql)
        } catch (err) {
          throw Object.assign(err, { changed: changed() })
        }

        return { changed: changed() }
      }

      case 'close':
        this.#statements.clear()
        this.#db?.close()
        this.#db = null
        return {}

      default:
        throw new Error(`unknown op: ${op}`)
    }
  }
}
