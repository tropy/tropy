// better-sqlite3's API, asynchronous, backed by a Web Worker running
// better-sqlite3 (src/sqlite/worker.js): the driver common/db.js uses
// in bundles (see #sqlite in package.json). Calls take SQL text; the
// worker prepares and caches statements. db.js awaits every call, so
// it works with this and with better-sqlite3 in process alike.

class Statement {
  #db

  constructor (db, sql, { readonly, reader }) {
    this.#db = db
    this.source = sql
    this.readonly = readonly
    this.reader = reader
  }

  all (...values) {
    return this.#db.request('all', { sql: this.source, values })
  }

  get (...values) {
    return this.#db.request('get', { sql: this.source, values })
  }

  run (...values) {
    return this.#db.request('run', { sql: this.source, values })
  }

  // Not in better-sqlite3: the first column as an Int32Array,
  // built and transferred by the worker (see Connection#ids).
  ids (...values) {
    return this.#db.request('ids', { sql: this.source, values })
  }

  // Rows arrive in batches; yields them one at a time.
  async * iterate (...values) {
    let rows = []
    let done = false
    let failure
    let notify

    this.#db.request('iterate', { sql: this.source, values }, (batch) => {
      rows.push(...batch)
      notify?.()
    }).then(
      () => { done = true; notify?.() },
      (err) => { failure = err; done = true; notify?.() })

    while (true) {
      let next = new Promise(resolve => { notify = resolve })

      if (rows.length > 0) {
        let batch = rows
        rows = []
        yield * batch
        continue
      }

      if (failure) throw failure
      if (done) return

      await next
    }
  }
}

export default class Database {
  // Connections wait for locks in their own worker, not this thread,
  // so db.js may pool several (see Database in common/db.js).
  static concurrent = true

  #worker
  #pending = new Map()
  #seq = 0
  #open

  constructor (path, options) {
    this.#worker = new Worker(new URL('./sqlite-worker.cjs', import.meta.url))

    this.#worker.onmessage = ({ data: { id, value, batch, error } }) => {
      let request = this.#pending.get(id)
      if (request == null) return

      if (batch) return request.onBatch(batch)

      this.#pending.delete(id)

      if (error)
        request.reject(Object.assign(new Error(error.message), error))
      else
        request.resolve(value)
    }

    this.#worker.onerror = (event) => {
      let err = new Error(event.message || 'DB worker failed')
      for (let request of this.#pending.values()) request.reject(err)
      this.#pending.clear()
    }

    this.#open = this.#post('open', { path, options })
  }

  #post (op, message, onBatch) {
    return new Promise((resolve, reject) => {
      let id = ++this.#seq
      this.#pending.set(id, { resolve, reject, onBatch })
      this.#worker.postMessage({ id, op, ...message })
    })
  }

  // Requests wait for the open, so its error reaches the first caller.
  async request (op, message, onBatch) {
    await this.#open
    return this.#post(op, message, onBatch)
  }

  async prepare (sql) {
    return new Statement(this, sql, await this.request('prepare', { sql }))
  }

  exec (sql) {
    return this.request('exec', { sql })
  }

  unsafeMode (flag = true) {
    return this.request('unsafeMode', { flag })
  }

  async close () {
    try {
      await this.request('close', {})
    } finally {
      this.#worker.terminate()
    }
  }
}
