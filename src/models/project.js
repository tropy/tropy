'use strict'

const assert = require('assert')
const uuid = require('uuid/v4')
const { all } = require('bluebird')
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
    const [project, items] = await all([
      db.get(`
        SELECT project_id AS id, name FROM project LIMIT 1`),
      db.get(`
        SELECT COUNT (id) AS total
          FROM items LEFT OUTER JOIN trash USING (id)
          WHERE deleted IS NULL`)
    ])

    assert(project != null, 'no project found')
    project.items = items.total

    return project
  },

  save(db, { id, name }) {
    return db.run(
      'UPDATE project SET name = ? WHERE project_id = ?',
      name, id
    )
  }
}
