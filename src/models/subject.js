import { blank } from '../common/util.js'
import { deleteFrom, into, update } from '../common/query.js'

export function touch(db, { id, timestamp = Date.now() }) {
  return update(db, { id, timestamp })
}

export default {
  create(db, { template, timestamp = Date.now() }) {
    return db.run(
      ...into('subjects').insert({
        template,
        created: new Date(timestamp).toISOString()
      })
    )
  },

  dup(db, id) {
    return db.run(`
      INSERT INTO subjects (template)
        SELECT template FROM subjects WHERE id = ?`, id)
  },

  touch,

  update(db, { id, template, timestamp = Date.now() }) {
    let query = update('subjects')
      .set({
        modified: new Date(timestamp).toISOString()
      })
      .where({ id })

    if (!blank(template)) {
      query.set({ template })
    }

    return db.run(...query)
  },

  destroy(db, id) {
    return db.run(
      ...deleteFrom('subjects').where({ id })
    )
  },

  prune(db) {
    return db.run(
      ...deleteFrom('subjects')
        .where('id IN (SELECT id FROM trash WHERE reason = "auto")')
    )
  }
}
