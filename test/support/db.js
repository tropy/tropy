import { unlink } from 'node:fs/promises'
import { mktmp } from './tmp.js'
import { Database } from '../../src/common/db.js'

// Creates a temporary database.
//
// Returns a React-style ref object whose 'current' field will be set
// to point to the current database connection in a `beforeEach` hook
// and that will be removed in `afterEach`.
//
// If this is called with a `name` other than ':memory:'
// a temporary file of that name will be created.
// The file will be removed again by the `afterEach` hook.
//
// Use the `init` argument to pass an optional initialization script;
// the current database connection will be passed to this script
// along with any additional arguments.

export function mkdbtmp(name = ':memory:', init, ...args) {
  let db = { current: null }
  let isInMemory = name === ':memory:'
  let file = isInMemory ? name : mktmp(name)

  beforeEach(async () => {
    db.current = new Database(file)

    if (init)
      await init(db.current, ...args)
  })

  afterEach(async () => {
    await db.current.close()
    db.current = null

    if (!isInMemory)
      await unlink(file)
  })

  return db
}
