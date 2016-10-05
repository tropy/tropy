'use strict'

module.exports = {
  async load(db) {
    return await db.get(
      'SELECT project_id AS id, name FROM project'
    )
  },

  async save(db, { id, name }) {
    return await db.run(
      'UPDATE project SET name = ? WHERE project_id = ?', name, id
    )
  }
}
