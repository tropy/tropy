'use strict'

module.exports = {
  async load(db) {
    const tags = {}

    await db.each(
      'SELECT tag_id AS id, name, visible FROM tags',
      (data) => { tags[data.id] = data }
    )

    return tags
  },

  async create(db, { name }) {
    const { id } = await db.run(
      'INSERT INTO tags (name) VALUES (?)', name
    )

    return { id, name, visible: true }
  },

  async save(db, { id, name }) {
    return db.run(
      'UPDATE tags SET name = ?, modified = datetime("now") WHERE tag_id = ?',
      name, id
    )
  },

  async hide(db, id) {
    return db.run(
      'UPDATE tags SET visible = 0 WHERE tag_id = ?', id
    )
  },

  async show(db, id) {
    return db.run(
      'UPDATE tags SET visible = 1 WHERE tag_id = ?', id
    )
  },

  async prune(db) {
    return db.run(
      'DELETE FROM tags WHERE visible = 0'
    )
  }
}
