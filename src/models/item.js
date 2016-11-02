'use strict'


module.exports = {

  async all(db) {
    return (await db.all(`
      WITH
        titles(id, value) AS (
          SELECT id, value AS title
          FROM metadata JOIN metadata_values USING (value_id)
          WHERE property = 'title'
        )
        SELECT id, t.value
          FROM items
            LEFT OUTER JOIN titles t USING (id)
            LEFT OUTER JOIN trash USING (id)
          WHERE deleted_at IS NULL
          ORDER BY t.value ASC, id ASC`
    )).map(item => item.id)
  },

  async deleted(db) {
    return await db.all(`
      SELECT id AS id, created_at AS created, updated_ad AS modified
        FROM subjects JOIN trash USING (id)
        LIMIT 100`
    )
  },

  async create(db, template) {
    const { id } = await db.run(`
      INSERT INTO subjects (template_id) VALUES (?)`, template)

    await db.run('INSERT INTO items (id) VALUES (?)', id)

    return { id }
  },

  async delete(db, id) {
    return await db.run(
      'INSERT INTO trash (id) VALUES (?)', id
    )
  },

  async restore(db, id) {
    return await db.run(
      'DELETE FROM trash WHERE id = ?', id
    )
  },

  async prune(db) {
    return await db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id
          FROM trash JOIN items USING (id)
          WHERE deleted_at < datetime("now", "-1 month"))`
    )
  }
}
