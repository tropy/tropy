'use strict'

const { all } = require('bluebird')
const { assign } = Object
const { into, map } = require('transducers.js')
const { uniq } = require('../common/util')

const mod = {
  metadata: require('./metadata'),
  photo: require('./photo')
}

const skel = (id) => ({
  id, tags: [], photos: [], lists: []
})

module.exports = mod.item = {
  async all(db, { trash, tags, sort }) {
    const items = []
    const dir = sort.asc ? 'ASC' : 'DESC'

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
          ORDER BY sort.value ${dir}, id ${dir}`, {

            $sort: sort.column

          }, ({ id }) => { items.push(id) })

    return items
  },

  async trash(db, { sort }) {
    const items = []
    const dir = sort.asc ? 'ASC' : 'DESC'

    await db.each(`
      WITH
        sort(id, value) AS (
          SELECT id, value
          FROM metadata JOIN metadata_values USING (value_id)
          WHERE property = $sort
        )
        SELECT id, sort.value
          FROM items
            JOIN trash USING (id)
            LEFT OUTER JOIN sort USING (id)
          WHERE reason = 'user'
          ORDER BY sort.value ${dir}, id ${dir}`, {

            $sort: sort.column

          }, ({ id }) => { items.push(id) })

    return items
  },

  async list(db, list, { tags, sort }) {
    const items = []
    const dir = sort.asc ? 'ASC' : 'DESC'

    await db.each(`
      SELECT id, added
        FROM list_items
          ${tags.length ? 'JOIN taggings USING (id)' : ''}
          LEFT OUTER JOIN items USING (id)
          LEFT OUTER JOIN trash USING (id)
          WHERE
            list_id = $list AND list_items.deleted IS NULL AND
            ${tags.length ? `tag_id IN (${tags.join(',')}) AND` : ''}
            trash.deleted IS NULL
          ORDER BY added ${dir}, id ${dir}`, {

            $list: list

          }, ({ id }) => { items.push(id) })

    return items
  },

  async load(db, ids) {
    const items = into({}, map(id => [id, skel(id)]), ids)

    if (ids.length) {
      ids = ids.join(',')

      await all([
        db.each(`
          SELECT id, template, created, modified, deleted
            FROM subjects
              JOIN items USING (id)
              LEFT OUTER JOIN trash USING (id)
            WHERE id IN (${ids})`,

          (data) => {
            assign(items[data.id], data, { deleted: !!data.deleted })
          }
        ),

        db.each(`
          SELECT id, tag_id AS tag
            FROM taggings WHERE id IN (${ids})
            ORDER BY id, tagged`,
          ({ id, tag }) => {
            items[id].tags.push(tag)
          }
        ),

        db.each(`
          SELECT id AS photo, item_id AS item
            FROM photos
              LEFT OUTER JOIN trash USING (id)
            WHERE item IN (${ids})
              AND deleted IS NULL
            ORDER BY item, position`,
          ({ item, photo }) => {
            items[item].photos.push(photo)
          }
        ),

        db.each(`
          SELECT id, list_id AS list
            FROM list_items WHERE id IN (${ids})`,
          ({ id, list }) => {
            items[id].lists.push(list)
          }
        )
      ])
    }

    return items
  },

  async create(db, data) {
    const { id } = await db.run(`
      INSERT INTO subjects DEFAULT VALUES`)
    await db.run(`
      INSERT INTO items (id) VALUES (?)`, id)

    if (data) {
      await mod.metadata.update(db, { id, data })
    }

    const { [id]: item } = await mod.item.load(db, [id])
    return item

  },

  async update(db, { id, property, value }) {
    if (property !== 'template') return

    return db.run(`
      UPDATE subjects SET template = ? WHERE id = ?`, value, id)
  },

  async merge(db, item, items, metadata) {
    let photos = [], tags = [], lists = [], ids = []

    let data = { ...metadata[item.id] }
    delete data.id

    let tmem = new Set()
    let lmem = new Set()

    uniq(item.tags, [], tmem)
    uniq(item.lists, [], lmem)

    for (let it of items) {
      ids.push(it.id)
      photos = photos.concat(it.photos)

      uniq(it.tags, tags, tmem)
      uniq(it.lists, lists, lmem)

      for (let prop in metadata[it.id]) {
        if (prop !== 'id' && !(prop in data)) {
          data[prop] = { ...metadata[it.id][prop] }
        }
      }
    }

    await all([
      mod.photo.merge(db, item.id, photos, item.photos.length),
      mod.item.tags.add(db, tags.map(tag => ({ id: item.id, tag }))),
      mod.item.lists.merge(db, item.id, ids, lists),
      mod.metadata.update(db, { id: item.id, data })
    ])

    await mod.item.delete(db, ids, 'merge')

    return {
      photos, tags, lists, data
    }
  },

  async delete(db, ids, $reason = 'user') {
    return db.run(`
      INSERT INTO trash (id, reason)
        VALUES ${ids.map(id => `(${id}, $reason)`).join(',')}`, { $reason }
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
      ` OR deleted < datetime("now", "${since}")` : ''

    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id
            FROM trash JOIN items USING (id)
            WHERE reason != 'user'${condition})`
    )
  },

  tags: {
    async add(db, values) {
      if (values.length) {
        return db.run(`
          INSERT INTO taggings (tag_id, id) VALUES ${
            values.map(({ id, tag }) =>
              `(${Number(tag)}, ${Number(id)})`).join(',')
            }`)
      }
    },

    async clear(db, id) {
      return db.run('DELETE FROM taggings WHERE id = ?', id)
    },

    async remove(db, { id, tags }) {
      return db.run(`
        DELETE FROM taggings
          WHERE id = ? AND tag_id IN (${tags.map(Number).join(',')})`, id)
    }
  },

  lists: {
    async merge(db, id, items, lists) {
      return db.run(`
        INSERT INTO list_items (list_id, id, position, added)
          SELECT list_id, ${Number(id)} AS id, position, added
            FROM list_items li
            WHERE list_id IN (${lists.map(Number).join(',')})
              AND li.id IN (${items.map(Number).join(',')})
              AND deleted IS NULL
            GROUP BY list_id`)
    },

    async remove(db, id, lists) {
      return db.run(`
        DELETE FROM list_items
          WHERE id = ? AND list_id IN (${lists.map(Number).join(',')})`)
    }
  }
}
