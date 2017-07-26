'use strict'

const { all } = require('bluebird')
const { assign } = Object
const { into, map } = require('transducers.js')
const { array, list: lst, uniq } = require('../common/util')
const { TEMPLATE } = require('../constants/item')

const mod = {
  metadata: require('./metadata'),
  photo: require('./photo')
}

const skel = (id) => ({
  id, tags: [], photos: [], lists: []
})

const SEARCH = `
  SELECT item_id AS id
    FROM fts_notes JOIN photos USING (id)
    WHERE fts_notes MATCH $query
  UNION
  SELECT coalesce(items.id, item_id) AS id
    FROM metadata
      JOIN fts_metadata ON (value_id = fts_metadata.rowid)
      LEFT OUTER JOIN items USING (id)
      LEFT OUTER JOIN photos USING (id)
    WHERE fts_metadata MATCH $query`

const prefix = (query) =>
  (!(/[*+'"]/).test(query)) ? query + '*' : query


module.exports = mod.item = {

  async all(db, { trash, tags, sort, query }) {
    const items = []
    const dir = sort.asc ? 'ASC' : 'DESC'

    const params = { $sort: sort.column }

    query = query.trim()

    if (query.length) {
      params.$query = prefix(query)
    }

    await db.each(`
      WITH
        sort(id, text) AS (
          SELECT id, text
          FROM metadata JOIN metadata_values USING (value_id)
          WHERE property = $sort
        )
        SELECT DISTINCT id
          FROM items
            ${tags.length ? 'JOIN taggings USING (id)' : ''}
            LEFT OUTER JOIN sort USING (id)
            LEFT OUTER JOIN trash USING (id)
          WHERE
            ${(tags.length > 0) ? `tag_id IN (${lst(tags)}) AND` : ''}
            ${(query.length > 0) ? `id IN (${SEARCH}) AND` : ''}
            deleted ${trash ? 'NOT' : 'IS'} NULL
          ORDER BY sort.text ${dir}, id ${dir}`,
      params,
      ({ id }) => { items.push(id) })

    return items
  },

  async trash(db, { sort, query }) {
    const items = []
    const dir = sort.asc ? 'ASC' : 'DESC'

    const params = { $sort: sort.column }

    query = query.trim()

    if (query.length) {
      params.$query = prefix(query)
    }

    await db.each(`
      WITH
        sort(id, text) AS (
          SELECT id, text
          FROM metadata JOIN metadata_values USING (value_id)
          WHERE property = $sort
        )
        SELECT DISTINCT id
          FROM items
            JOIN trash USING (id)
            LEFT OUTER JOIN sort USING (id)
          WHERE
            ${(query.length > 0) ? `id IN (${SEARCH}) AND` : ''}
            reason = 'user'
          ORDER BY sort.text ${dir}, id ${dir}`,
      params,
      ({ id }) => { items.push(id) })

    return items
  },

  async list(db, list, { tags, sort, query }) {
    const items = []
    const dir = sort.asc ? 'ASC' : 'DESC'
    const params = { $list: list }

    query = query.trim()

    if (query.length) {
      params.$query = prefix(query)
    }

    await db.each(`
      SELECT DISTINCT id, added
        FROM list_items
          ${tags.length ? 'JOIN taggings USING (id)' : ''}
          LEFT OUTER JOIN items USING (id)
          LEFT OUTER JOIN trash USING (id)
          WHERE
            list_id = $list AND list_items.deleted IS NULL AND
            ${(query.length > 0) ? `id IN (${SEARCH}) AND` : ''}
            ${tags.length ? `tag_id IN (${tags.join(',')}) AND` : ''}
            trash.deleted IS NULL
          ORDER BY added ${dir}, id ${dir}`,
      params,
      ({ id }) => { items.push(id) })

    return items
  },

  async load(db, ids) {
    const items = into({}, map(id => [id, skel(id)]), ids)

    if (ids.length) {
      ids = ids.join(',')

      await all([
        db.each(`
          SELECT
              id,
              template,
              datetime(created, "localtime") AS created,
              datetime(modified, "localtime") AS modified,
              deleted
            FROM subjects
              JOIN items USING (id)
              LEFT OUTER JOIN trash USING (id)
            WHERE id IN (${ids})`,

          (data) => {
            assign(items[data.id], data, {
              created: new Date(data.created),
              modified: new Date(data.modified),
              deleted: !!data.deleted
            })
          }
        ),

        db.each(`
          SELECT id, tag_id AS tag
            FROM taggings WHERE id IN (${ids})`,
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

  async create(db, template, data) {
    const { id } = await db.run(`
      INSERT INTO subjects (template) VALUES (?)`, template || TEMPLATE)
    await db.run(`
      INSERT INTO items (id) VALUES (?)`, id)

    if (data) {
      await mod.metadata.update(db, { ids: [id], data })
    }

    return (await mod.item.load(db, [id]))[id]
  },

  async dup(db, source) {
    const { id } = await db.run(`
      INSERT INTO subjects (template)
        SELECT template FROM subjects WHERE id = ?`, source)
    await db.run(`
      INSERT INTO items (id) VALUES (?)`, id)

    await all([
      mod.metadata.copy(db, { source, target: id }),
      mod.item.tags.copy(db, { source, target: id }),
      mod.item.lists.copy(db, { source, target: id })
    ])

    return (await mod.item.load(db, [id]))[id]
  },

  async update(db, ids, data) {
    for (let prop in data) {
      if (prop !== 'template') continue

      await db.run(`
        UPDATE subjects
          SET template = ?, modified = datetime("now")
          WHERE id IN (${lst(ids)})`,
        data[prop])
    }
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
      mod.metadata.update(db, { ids: [item.id], data }),
      mod.item.delete(db, ids, 'auto')
    ])

    return {
      photos, tags, lists, data
    }
  },

  async split(db, id, items, data, lists, tags) {
    await all([
      mod.photo.split(db, id, items),
      mod.item.tags.remove(db, { id, tags }),
      mod.item.lists.remove(db, id, lists),
      mod.metadata.replace(db, { ids: [id], data }),
      mod.item.restore(db, items.map(i => i.id))
    ])
  },

  async implode(db, { id, photos, items }) {
    await all([
      mod.photo.move(db, { ids: photos, item: id }),
      mod.photo.order(db, id, photos),
      mod.item.delete(db, items, 'auto')
    ])
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
      ` WHERE reason != 'user' OR
         (reason = 'user' AND deleted < datetime("now", "${since}"))` : ''

    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash JOIN items USING (id)${condition})`
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
          WHERE id IN (${lst(array(id))}) AND tag_id IN (${lst(tags)})`)
    },

    async copy(db, { source, target }) {
      return db.run(`
        INSERT INTO taggings (tag_id, id)
          SELECT tag_id, ${Number(target)} AS id
            FROM taggings WHERE id = ?`, source)
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
          WHERE id = ? AND list_id IN (${lists.map(Number).join(',')})`, id)
    },

    async copy(db, { source, target }) {
      return db.run(`
        INSERT INTO list_items (list_id, id, position, added)
          SELECT list_id, ${Number(target)} AS id, position, added
            FROM list_items WHERE id = ?`, source)
    }
  }
}
