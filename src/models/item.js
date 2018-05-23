'use strict'

const { all } = require('bluebird')
const { assign } = Object
const { array, blank, list: lst, remove, uniq } = require('../common/util')
const { ITEM: { TEMPLATE }, NAV: { COLUMN } } = require('../constants')
const { select } = require('../common/query')

const mod = {
  metadata: require('./metadata'),
  photo: require('./photo'),
  subject: require('./subject')
}

const skel = (id, lists = [], photos = [], tags = []) => ({
  id, lists, photos, tags
})

const SEARCH = `
  SELECT item_id AS id
    FROM fts_notes n
      LEFT OUTER JOIN selections USING (id)
      LEFT OUTER JOIN photos p ON (p.id = n.id OR p.id = photo_id)
    WHERE fts_notes MATCH $query
  UNION
  SELECT coalesce(i.id, p.item_id) AS id
    FROM metadata m
      JOIN fts_metadata ON (value_id = fts_metadata.rowid)
      LEFT OUTER JOIN items i USING (id)
      LEFT OUTER JOIN selections USING (id)
      LEFT OUTER JOIN photos p ON (p.id = m.id OR p.id = photo_id)
    WHERE fts_metadata MATCH $query`

const SORT = `
  WITH sort(id, text) AS (
    SELECT id, text
    FROM metadata JOIN metadata_values USING (value_id)
    WHERE property = $sort)`

const ORDER = {
  [COLUMN.CREATED.id]: 'subjects.created',
  [COLUMN.MODIFIED.id]: 'subjects.modified',
  [COLUMN.POSITION.id]: 'list_items.added'
}

const prefix = (query) =>
  (!(/[*+'"]/).test(query)) ? query + '*' : query

function prep({ query, sort, tags }, params = {}) {
  if (!(sort.column in ORDER)) {
    params.$sort = sort.column
  }

  if (query != null) {
    query = query.trim()
    if (query.length > 0) {
      params.$query = prefix(query)
    }
  }

  if (!blank(tags)) {
    if (tags.length > 0) {
      params.$tags = tags.length
    }
  }

  return {
    dir: sort.asc ? 'ASC' : 'DESC',
    order: ORDER[sort.column] || 'sort.text',
    params
  }
}

async function search(db, query, params) {
  const items = []
  items.idx = {}

  await db.each(query, params, ({ id }) => {
    items.idx[id] = items.length
    items.push(id)
  })

  return { items }
}


module.exports = mod.item = {
  all(db, { trash, ...options }) {
    let { dir, order, params } = prep(options)
    return search(db, `
      ${params.$sort ? SORT : ''}
      SELECT DISTINCT id
        FROM items
          ${params.$tags ? 'JOIN taggings USING (id)' : ''}
          ${params.$sort ?
            'LEFT OUTER JOIN sort USING (id)' :
            'JOIN subjects USING (id)'}
          LEFT OUTER JOIN trash USING (id)
        WHERE
          ${params.$tags ? `tag_id IN (${lst(options.tags)}) AND` : ''}
          ${params.$query ? `id IN (${SEARCH}) AND` : ''}
          deleted ${trash ? 'NOT' : 'IS'} NULL
        ${params.$tags ? 'GROUP BY id HAVING COUNT(tag_id) = $tags' : ''}
        ORDER BY ${order} ${dir}, id ${dir}`,
      params)
  },

  async find(db, { ids, ...options }) {
    let { dir, order, params } = prep(options)
    return search(db, `
      ${params.$sort ? SORT : ''}
      SELECT DISTINCT id
        FROM items
          ${params.$sort ?
            'LEFT OUTER JOIN sort USING (id)' :
            'JOIN subjects USING (id)'}
          LEFT OUTER JOIN trash USING (id)
        WHERE
          id IN (${lst(ids)}) AND deleted IS NULL
          ${params.$query ? `AND id IN (${SEARCH})` : ''}
        ORDER BY ${order} ${dir}, id ${dir}`,
      params)
  },

  async trash(db, options) {
    let { dir, order, params } = prep(options)
    return search(db, `
      ${params.$sort ? SORT : ''}
      SELECT DISTINCT id
        FROM items
          JOIN trash USING (id)
          ${params.$sort ?
            'LEFT OUTER JOIN sort USING (id)' :
            'JOIN subjects USING (id)'}
        WHERE
          ${params.$query ? `id IN (${SEARCH}) AND` : ''}
          reason = 'user'
        ORDER BY ${order} ${dir}, id ${dir}`,
      params)
  },

  async list(db, list, options) {
    let { dir, order, params } = prep(options, { $list: list })
    return search(db, `
      ${params.$sort ? SORT : ''}
      SELECT DISTINCT id, added
        FROM list_items
          ${params.$sort ?
            'LEFT OUTER JOIN sort USING (id)' :
            'JOIN subjects USING (id)'}
          ${params.$tags ? 'JOIN taggings USING (id)' : ''}
          LEFT OUTER JOIN items USING (id)
          LEFT OUTER JOIN trash USING (id)
        WHERE
          list_id = $list AND list_items.deleted IS NULL AND
          ${params.$query ? `id IN (${SEARCH}) AND` : ''}
          ${params.$tags ? `tag_id IN (${lst(options.tags)}) AND` : ''}
          trash.deleted IS NULL
        ${params.$tags ? 'GROUP BY id HAVING COUNT(tag_id) = $tags' : ''}
        ORDER BY ${order} ${dir}, id ${dir}`,
      params)
  },

  async load(db, ids) {
    const items = {}
    if (ids != null) ids = ids.join(',')

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
            LEFT OUTER JOIN trash USING (id)${
          (ids != null) ? ` WHERE id IN (${ids})` : ''
        }`,
        ({ id, created, modified, deleted, ...data }) => {
          data.created = new Date(created)
          data.modified = new Date(modified)
          data.deleted = !!deleted

          if (id in items) assign(items[id], data)
          else items[id] = assign(skel(id), data)
        }
      ),

      db.each(`
        SELECT id, tag_id AS tag
          FROM taggings${
          (ids != null) ? ` WHERE id IN (${ids})` : ''
        }`,
        ({ id, tag }) => {
          if (id in items) items[id].tags.push(tag)
          else items[id] = skel(id, [], [], [tag])
        }
      ),

      db.each(`
        SELECT id AS photo, item_id AS id
          FROM photos
            LEFT OUTER JOIN trash USING (id)
          WHERE ${(ids != null) ? `item_id IN (${ids}) AND` : ''}
            deleted IS NULL
          ORDER BY item_id, position`,
        ({ id, photo }) => {
          if (id in items) items[id].photos.push(photo)
          else items[id] = skel(id, [], [photo])
        }
      ),

      db.each(`
        SELECT id, list_id AS list
          FROM list_items${
          (ids != null) ? ` WHERE id IN (${ids})` : ''
        }`,
        ({ id, list }) => {
          if (id in items) items[id].lists.push(list)
          else items[id] = skel(id, [list])
        }
      )
    ])

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

  update(db, id, data, timestamp = Date.now()) {
    return mod.subject.update(db, { id, template: data.template, timestamp })
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
      mod.item.tags.set(db, tags.map(tag => ({ id: item.id, tag }))),
      mod.item.lists.merge(db, item.id, ids, lists),
      mod.metadata.update(db, { ids: [item.id], data }),
      mod.item.delete(db, ids, 'auto')
    ])

    return {
      photos, tags, lists, data
    }
  },

  split(db, id, items, data, lists, tags) {
    return all([
      mod.photo.split(db, id, items),
      mod.item.tags.remove(db, { id, tags }),
      mod.item.lists.remove(db, id, lists),
      mod.metadata.replace(db, { ids: [id], data }),
      mod.item.restore(db, items.map(i => i.id))
    ])
  },

  implode(db, { id, photos, items }) {
    return all([
      mod.photo.move(db, { ids: photos, item: id }),
      mod.photo.order(db, id, photos),
      mod.item.delete(db, items, 'auto')
    ])
  },

  delete(db, ids, $reason = 'user') {
    return db.run(`
      INSERT INTO trash (id, reason)
        VALUES ${ids.map(id => `(${id}, $reason)`).join(',')}`, { $reason }
    )
  },

  restore(db, ids) {
    return db.run(
      `DELETE FROM trash WHERE id IN (${ids.join(',')})`
    )
  },

  destroy(db, ids) {
    return db.run(
      `DELETE FROM subjects WHERE id IN (${ids.join(',')})`
    )
  },

  prune(db, since = '-1 month') {
    const condition = since ?
      ` WHERE reason IN ('auto', 'merge')
          OR deleted < datetime("now", "${since}")` : ''

    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash JOIN items USING (id)${condition})`
    )
  },

  tags: {
    async add(db, { id, tag }) {
      const dupes = await db.all(
        ...select('id').from('taggings').where({ tag_id: tag, id }))

      id = remove(id, ...dupes.map(r => r.id))

      const res = (id.length === 0) ? { changes: 0 } :
        await db.run(`
          INSERT INTO taggings (tag_id, id) VALUES ${
            id.map(i => `(${tag}, ${i})`).join(',')
          }`)

      return { ...res, id }
    },

    async set(db, values) {
      if (values.length) {
        return db.run(`
          INSERT INTO taggings (tag_id, id) VALUES ${
            values.map(({ tag, id }) => `(${tag}, ${id})`).join(',')
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
