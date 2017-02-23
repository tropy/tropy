'use strict'

const uuid = require('uuid/v4')
const { resolve, join } = require('path')

const ROOT = resolve(__dirname, '..', '..', 'db')
const SCHEMA = join(ROOT, 'schema.sql')

module.exports = {
  async create(db, { name, id }) {
    try {
      id = id || uuid()

      await db.read(SCHEMA)
      await db.run(
        'INSERT INTO project (project_id, name) VALUES (?,?)', id, name
      )

    } finally {
      if (db) await db.close()
    }
  },

  async load(db) {
    return db.get(
      'SELECT project_id AS id, name FROM project'
    )
  },

  async save(db, { id, name }) {
    return db.run(
      'UPDATE project SET name = ?, modified = datetime("now") WHERE project_id = ?',
      name, id
    )
  },

  async touch(db, { id }) {
    return db.run(
      'UPDATE project SET opened = datetime("now") WHERE project_id = ?',
      id
    )
  }
}
