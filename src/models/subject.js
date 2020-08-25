import { blank } from '../common/util'
import { update } from '../common/query'

export function touch(db, { id, timestamp = Date.now() }) {
  return update(db, { id, timestamp })
}

export default {
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

  prune(db) {
    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash WHERE reason = 'auto'
        )`)
  }
}
