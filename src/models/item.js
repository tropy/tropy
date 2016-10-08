'use strict'

module.exports = {

  async all(db) {
    return await db.all(`
      SELECT sid AS id, created_at AS created, updated_ad AS modified
      FROM subjects JOIN items USING (sid)
      WHERE sid NOT IN (SELECT sid FROM trash)
      LIMIT 100`
    )
  },

  async deleted(db) {
    return await db.all(`
      SELECT sid AS id, created_at AS created, updated_ad AS modified
      FROM subjects JOIN trash USING (sid)
      LIMIT 100`
    )
  },

  async create(db, template) {
    const { id } = await db.run(`
      INSERT INTO subjects (template_id) VALUES (?);
      INSERT INTO items (sid) VALUES (last_insert_rowid())`,
      template
    )

    return { id }
  },

  async delete(db, id) {
    return await db.run(
      'INSERT INTO trash (sid) VALUES (?)', id
    )
  },

  async restore(db, id) {
    return await db.run(
      'DELETE FROM trash WHERE sid = ?', id
    )
  },

  async prune(db) {
    return await db.run(`
      DELETE FROM subjects
      WHERE sid IN (
        SELECT sid
        FROM trash JOIN items USING (sid)
        WHERE deleted_at < datetime("now", "-1 month"))`
    )
  }
}
