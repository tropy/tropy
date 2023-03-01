import { select } from '../common/query.js'

export default {
  orphaned(db) {
    return db.all(
      ...select()
        .from('deleted_photos')
        .where('path NOT IN (SELECT DISTINCT path FROM photos)')
    )
  },

  async purge(db) {
    await db.run('DELETE FROM deleted_photos')
  }
}
