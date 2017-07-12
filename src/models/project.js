'use strict'

const uuid = require('uuid/v4')
const { PROJECT } = require('../constants')

module.exports = {
  async create(db, { name, id }) {
    id = id || uuid()

    await db.read(PROJECT.SCHEMA)
    await db.run(
      'INSERT INTO project (project_id, name) VALUES (?,?)', id, name
    )
  },

  async load(db) {
    return db.get(
      'SELECT project_id AS id, name FROM project'
    )
  },

  async save(db, { id, name }) {
    return db.run(
      'UPDATE project SET name = ? WHERE project_id = ?',
      name, id
    )
  }
}
