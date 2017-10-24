'use strict'

const assert = require('assert')
const subject = require('./subject')

const COLUMNS = [
  'width', 'height', 'angle', 'mirror'
]

module.exports = {
  async save(db, { id, timestamp, ...data }) {
    const assignments = []
    const params = { $id: id }

    for (let column of COLUMNS) {
      if (column in data) {
        assignments.push(`${column} = $${column}`)
        params[`$${column}`] = data[column]
      }
    }

    assert(id != null, 'missing image id')
    if (assignments.length === 0) return

    await db.run(`
      UPDATE images
        SET ${assignments.join(', ')}
        WHERE id = $id`, params)

    if (timestamp != null) {
      await subject.touch(db, { id, timestamp })
    }
  }
}
