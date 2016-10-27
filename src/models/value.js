'use strict'

module.exports = {
  async save(db, { value, type }) {
    let v = await db.get(`
      SELECT value_id AS id
        FROM metadata_values
        WHERE type_name = ? AND value = ?`, type, value)

    if (!v) {
      v = await db.run(`
        INSERT INTO metadata_values (type_name, value)
          VALUES (?, ?)`, type, value)
    }

    return v.id
  },

  async prune(db) {
    return await db.run(`
      DELETE
        FROM metadata_values
        WHERE value_id IN (
          SELECT v.value_id
            FROM metadata_values v
              LEFT OUTER JOIN metadata m
              USING (value_id)
            WHERE m.value_id IS NULL
        )`
    )
  }
}
