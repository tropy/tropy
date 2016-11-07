'use strict'

module.exports = {

  async all(db, { trash }) {
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
          WHERE deleted_at ${trash ? 'NOT' : 'IS'} NULL
          ORDER BY t.value ASC, id ASC`
    )).map(item => item.id)
  },

  async load(db, ids) {
    const items = {}

    if (ids.length) {
      await db.each(`
        SELECT id, created_at AS created,
            updated_at AS modified, deleted_at AS deleted
          FROM subjects
            JOIN items USING (id)
            LEFT OUTER JOIN trash USING (id)
          WHERE id IN (${ids.join(',')})`,

        (item) => {
          items[item.id] = item
        }
      )
    }

    return items
  },

  async create(db) {
    const { id } = await db.run(`
      INSERT INTO subjects DEFAULT VALUES`)
    await db.run(`
      INSERT INTO items (id) VALUES (?)`, id)

    return await module.exports.load(db, [id])
  },

  async delete(db, id) {
    return await db.run(
      'INSERT INTO trash (id) VALUES (?)', id
    )
  },

  async restore(db, id) {
    await db.run(
      'DELETE FROM trash WHERE id = ?', id
    )
    return { id }
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
