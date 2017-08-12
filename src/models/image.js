'use strict'

const assert = require('assert')

module.exports = {

  async save(db, { id, timestamp, ...data }) {
    const assign = []
    const params = { $id: id }

    for (let attr in data) {
      assign.push(`${attr} = $${attr}`)
      params[`$${attr}`] = data[attr]
    }

    assert(id != null, 'missing image id')
    assert(assign.length > 0, 'missing assignments')

    await db.run(`
      UPDATE images
        SET ${assign.join(', ')}
        WHERE id = $id`, params)

    if (timestamp != null) {
      await db.run(`
        UPDATE subjects
          SET modified = datetime(?)
          WHERE id = ?`,
        new Date(timestamp).toISOString(), id)
    }
  },

}
