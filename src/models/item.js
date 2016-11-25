'use strict'

const num = (list, separator = ',') =>
  list ? list.split(separator).map(Number) : []

module.exports = {

  async all(db, { trash, tags }) {
    const items = []

    const sort = 'title'

    await db.each(`
      WITH
        sort(id, value) AS (
          SELECT id, value
          FROM metadata JOIN metadata_values USING (value_id)
          WHERE property = $sort
        )
        SELECT id, sort.value
          FROM items
            ${tags.length ? 'JOIN taggings USING (id)' : ''}
            LEFT OUTER JOIN sort USING (id)
            LEFT OUTER JOIN trash USING (id)
          WHERE
            ${tags.length ? `tag_id IN (${tags.join(',')}) AND` : ''}
            deleted ${trash ? 'NOT' : 'IS'} NULL
          ORDER BY sort.value ASC, id ASC`, {

            $sort: sort

          }, ({ id }) => { items.push(id) })

    return items
  },

  async load(db, ids) {
    const items = {}

    if (ids.length) {
      await db.each(`
        SELECT s.id, created, modified, deleted,
            group_concat(tag_id) AS tags,
            group_concat(photos.id) AS photos
          FROM subjects s
            JOIN items USING (id)
            LEFT OUTER JOIN trash USING (id)
            LEFT OUTER JOIN taggings USING (id)
            LEFT OUTER JOIN photos ON s.id = photos.item_id
          WHERE s.id IN (${ids.join(',')})
          GROUP BY s.id`,

        (item) => {
          items[item.id] = {
            ...item,
            photos: num(item.photos),
            tags: num(item.tags),
            deleted: !!item.deleted
          }
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

    return (await module.exports.load(db, [id]))[id]
  },

  async delete(db, ids) {
    return db.run(`
      INSERT INTO trash (id)
        VALUES ${ids.map(id => `(${id})`).join(',')}`
    )
  },

  async restore(db, ids) {
    return db.run(
      `DELETE FROM trash WHERE id IN (${ids.join(',')})`
    )
  },

  async destroy(db, ids) {
    return db.run(
      `DELETE FROM subjects WHERE id IN (${ids.join(',')})`
    )
  },

  async prune(db, since = '-1 month') {
    const condition = since ?
      ` WHERE deleted < datetime("now", "${since}"))` : ''

    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash JOIN items USING (id)${condition})`
    )
  },

  tags: {
    async add(db, values) {
      return db.run(`
        INSERT INTO taggings (id, tag_id) VALUES ${
          values.map(({ id, tag }) =>
            `(${Number(id)}, ${Number(tag)})`).join(',')
          }`)
    },

    async clear(db, id) {
      return db.run('DELETE FROM taggings WHERE id = ?', id)
    },

    async remove(db, { id, tags }) {
      return db.run(`
        DELETE FROM taggings
          WHERE id = ? AND tag_id IN (${tags.map(Number).join(',')})`, id)
    }
  }
}
