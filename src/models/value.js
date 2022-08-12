import { TYPE } from '../constants/index.js'

export async function save(db, { text, type = TYPE.TEXT }) {
  let v = await db.get(`
    SELECT value_id AS id
      FROM metadata_values
      WHERE datatype = ? AND text = ?`, type, text)

  if (!v) {
    v = await db.run(`
      INSERT INTO metadata_values (datatype, text)
        VALUES (?, ?)`, type, text)
  }

  return v.id
}

export default {
  save,

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
