// The DB worker: one better-sqlite3 connection in a Web Worker with
// Node (nodeIntegrationInWorker), driven by src/sqlite/proxy.js.
// SQL text and values travel; statements are prepared and cached here.
// Bundled on its own (lib/sqlite-worker.cjs; see rollup.config.js).
import Database from '#better-sqlite3'

const BATCH = 1000

let db
let statements = new Map()

function statement (sql) {
  let stmt = statements.get(sql)

  if (stmt == null) {
    stmt = db.prepare(sql)
    statements.set(sql, stmt)
  }

  return stmt
}

const reply = (id, value, transfer) =>
  self.postMessage({ id, value }, transfer)

// Errors travel as plain fields: cloning drops custom ones like code.
const fail = (id, { name, message, code, stack }) =>
  self.postMessage({ id, error: { name, message, code, stack } })

self.onmessage = ({ data: { id, op, sql, values = [], path, options, flag } }) => {
  try {
    switch (op) {
      case 'open':
        db = new Database(path, options)
        return reply(id)

      case 'unsafeMode':
        db.unsafeMode(flag)
        return reply(id)

      case 'prepare': {
        let { readonly, reader } = statement(sql)
        return reply(id, { readonly, reader })
      }

      case 'all':
        return reply(id, statement(sql).all(...values))

      case 'get':
        return reply(id, statement(sql).get(...values))

      // The first column as an Int32Array, transferred (no copy).
      case 'ids': {
        let stmt = statement(sql)
        let ids

        try {
          ids = Int32Array.from(stmt.pluck(true).all(...values))
        } finally {
          stmt.pluck(false)
        }

        return reply(id, ids, [ids.buffer])
      }

      case 'run': {
        let { changes, lastInsertRowid } = statement(sql).run(...values)
        return reply(id, { changes, lastInsertRowid })
      }

      // Rows in batches, so the receiver decodes while we query.
      case 'iterate': {
        let batch = []

        for (let row of statement(sql).iterate(...values)) {
          batch.push(row)

          if (batch.length === BATCH) {
            self.postMessage({ id, batch })
            batch = []
          }
        }

        if (batch.length > 0)
          self.postMessage({ id, batch })

        return reply(id)
      }

      case 'exec':
        db.exec(sql)
        return reply(id)

      case 'close':
        statements.clear()
        db?.close()
        db = null
        return reply(id)

      default:
        throw new Error(`unknown op: ${op}`)
    }
  } catch (err) {
    fail(id, err)
  }
}
