'use strict'

module.exports = {
  async load(db) {
    return await db.get(
      'SELECT project_id AS id, name FROM project'
    )
  },

  async save(db, { id, name }) {
    return await db.run(
      'UPDATE project SET name = ?, modified = datetime("now") WHERE project_id = ?',
      name, id
    )
  },

  async touch(db, { id }) {
    return await db.run(
      'UPDATE project SET opened = datetime("now") WHERE project_id = ?',
      id
    )
  }
}
