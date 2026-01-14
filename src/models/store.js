import { resolve } from 'node:path'
import { normalize } from '../common/os.js'
import { select } from '../common/query.js'

export default {
  async orphaned(db, basePath) {
    let photos = []
    await db.each(
      ...select()
        .from('deleted_photos')
        .where('path NOT IN (SELECT DISTINCT path FROM photos)'),
      ({ checksum, path }) => {
        photos.push({
          checksum,
          path: basePath
            ? resolve(basePath, normalize(path))
            : normalize(path)
        })
      })

    return photos
  },

  async purge(db) {
    await db.run('DELETE FROM deleted_photos')
  }
}
