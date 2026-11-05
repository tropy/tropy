import assert from 'node:assert'
import subject from './subject.js'
import { props } from '../common/export.js'
import { update } from '../common/query.js'
import { sql } from '../common/sql.js'
import { array, empty, pick } from '../common/util.js'

const COLUMNS = props.image.join(', ')

export default {
  copy (db, { source, target }) {
    return db.run(`
      INSERT INTO images (id, ${COLUMNS})
        SELECT ?, ${COLUMNS}
          FROM images
          WHERE id = ?`, target, source)
  },

  async rotate (db, { id, by }) {
    by = Number(by)

    assert(id != null, 'missing image id')
    assert(!isNaN(by), 'invalid angle')

    await db.run(sql`
      UPDATE images
        SET angle = ((360 + (angle + ${by})) % 360)
        WHERE id IN ${array(id)}`)

    let images = {}

    await db.each(sql`
      SELECT id, angle FROM images WHERE id IN ${array(id)}`,
    (image) => images[image.id] = { angle: image.angle })

    return images
  },

  async save (db, { id, timestamp, ...data }) {
    let image = pick(data, props.image)
    if (empty(image)) return

    assert(id != null, 'missing image id')

    await db.run(
      ...update('images')
        .set(image)
        .where({ id }))

    if (timestamp != null) {
      await subject.touch(db, { id, timestamp })
    }
  }
}
