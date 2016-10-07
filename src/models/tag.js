'use strict'

module.exports = {
  async all(db) {
    return await db.all(
      'SELECT tag_id AS id, name, visible FROM tags'
    )
  },

  async create(db, { name }) {
    const { id } = await db.run(
      'INSERT INTO tags (name) VALUES (?)', name
    )

    return { id, name, visible: true }
  },

  async save(db, { id, name }) {
    return await db.run(
      'UPDATE tags SET name = ?, updated_at = datetime("now") WHERE tag_id = ?',
      name, id
    )
  },

  async hide(db, id) {
    return await db.run(
      'UPDATE tags SET visible = 0 WHERE tag_id = ?', id
    )
  },

  async show(db, id) {
    return await db.run(
      'UPDATE tags SET visible = 1 WHERE tag_id = ?', id
    )
  },

  async prune(db) {
    return await db.run(
      'DELETE FROM tags WHERE visible = 0'
    )
  }
}
