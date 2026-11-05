import { array, blank, uniq } from '../common/util.js'
import { select } from '../common/query.js'
import { NAV } from '../constants/index.js'
import { createSequence } from '../common/sequence.js'

import modMetadata from './metadata.js'
import modPhoto from './photo.js'
import modSubject from './subject.js'

const mod = {
  metadata: modMetadata,
  photo: modPhoto,
  subject: modSubject
}

const skel = (id, lists = [], photos = [], tags = []) => ({
  id, lists, photos, tags
})

// Items matching term i in any FTS index or tag name.
const MATCH = (i) => `
  SELECT item_id AS id
    FROM fts_transcriptions t
      LEFT OUTER JOIN selections USING (id)
      LEFT OUTER JOIN photos p ON (p.id = t.id OR p.id = photo_id)
    WHERE fts_transcriptions MATCH $fts${i}
  UNION
  SELECT item_id AS id
    FROM fts_notes n
      LEFT OUTER JOIN selections USING (id)
      LEFT OUTER JOIN photos p ON (p.id = n.id OR p.id = photo_id)
    WHERE fts_notes MATCH $fts${i}
  UNION
  SELECT coalesce(i.id, p.item_id) AS id
    FROM metadata m
      JOIN fts_metadata ON (value_id = fts_metadata.rowid)
      LEFT OUTER JOIN items i USING (id)
      LEFT OUTER JOIN selections USING (id)
      LEFT OUTER JOIN photos p ON (p.id = m.id OR p.id = photo_id)
    WHERE fts_metadata MATCH $fts${i}
  UNION
  SELECT id
    FROM taggings JOIN tags USING (tag_id)
    WHERE name LIKE $tag${i} ESCAPE '\\'`

// Items matching every term: terms are ANDed per item,
// not per FTS document, so they can match different fields.
// Compound operators bind left to right, hence the subqueries.
const SEARCH = (n) =>
  Array.from({ length: n }, (_, i) => `SELECT id FROM (${MATCH(i)})`)
    .join(' INTERSECT ')

// Seed order for the subject columns; metadata columns join their values.
const ORDER = {
  [NAV.COLUMN.CREATED.id]: 'subjects.created',
  [NAV.COLUMN.MODIFIED.id]: 'subjects.modified',
  [NAV.COLUMN.TEMPLATE.id]: 'subjects.template'
}

// Matches a "quoted phrase" (with optional closing quote) or a bare term.
// Neither capture can contain a quote, so quoting them is safe for FTS5.
const TERMS = /"([^"]*)("?)|([^\s"]+)/g

// Splits the query into quoted phrases and terms,
// so user input is never FTS5 syntax.
// Terms match as prefixes, phrases match exactly.
// An unterminated phrase extends to the end of the query
// and matches as a prefix (user still typing presumably).
function parse (query) {
  let terms = new Map()

  for (let [, phrase, end, term] of query.matchAll(TERMS)) {
    if (terms.size === 32)
      break

    let t = (term != null)
      ? { text: term, prefix: true }
      : { text: phrase, prefix: !end }

    if (!blank(t.text.trim()))
      terms.set(`${t.prefix}:${t.text.toLowerCase()}`, t)
  }

  return [...terms.values()]
}

function prep ({ query, tags }, params = {}) {
  let terms = (query == null) ? [] : parse(query)
  tags = uniq(array(tags))

  for (let [i, { text, prefix }] of terms.entries()) {
    params[`$fts${i}`] = `"${text}"${prefix ? '*' : ''}`
    params[`$tag${i}`] = `%${text.replace(/[\\%_]/g, '\\$&')}%`
  }

  if (!blank(tags)) {
    if (tags.length > 0) {
      params.$tags = tags.length
      params.$tagIds = JSON.stringify(tags)
    }
  }

  return {
    params,
    match: (terms.length > 0) ? SEARCH(terms.length) : null
  }
}

async function search (db, query, params) {
  const [items, push] = createSequence()

  await db.each(query, params, ({ id }) => {
    push(id)
  })

  return { items: Object.freeze(items) }
}


mod.item = {
  all (db, options) {
    let { params, match } = prep(options)
    return search(db, `
      SELECT id
        FROM items
          ${params.$tags ? 'JOIN taggings USING (id)' : ''}
          LEFT OUTER JOIN trash USING (id)
        WHERE
          ${params.$tags ? 'tag_id IN (SELECT value FROM json_each($tagIds)) AND' : ''}
          ${match ? `id IN (${match}) AND` : ''}
          deleted IS NULL
        ${params.$tags ? 'GROUP BY id HAVING COUNT(tag_id) = $tags' : ''}`,
    params)
  },

  async find (db, { ids, ...options }) {
    let { params, match } = prep(options, { $ids: JSON.stringify(ids) })
    return search(db, `
      SELECT id
        FROM items
          LEFT OUTER JOIN trash USING (id)
        WHERE
          id IN (SELECT value FROM json_each($ids)) AND deleted IS NULL
          ${match ? `AND id IN (${match})` : ''}`,
    params)
  },

  async trash (db, options) {
    let { params, match } = prep(options)
    return search(db, `
      SELECT id
        FROM items
          JOIN trash USING (id)
        WHERE
          ${match ? `id IN (${match}) AND` : ''}
          reason = 'user'`,
    params)
  },

  // In list order: the order when sorting by position.
  async list (db, list, options) {
    let { params, match } = prep(options, { $list: list })
    return search(db, `
      SELECT id
        FROM list_items
          ${params.$tags ? 'JOIN taggings USING (id)' : ''}
          LEFT OUTER JOIN trash USING (id)
        WHERE
          list_id = $list AND list_items.deleted IS NULL AND
          ${match ? `id IN (${match}) AND` : ''}
          ${params.$tags ? 'tag_id IN (SELECT value FROM json_each($tagIds)) AND' : ''}
          trash.deleted IS NULL
        ${params.$tags ? 'GROUP BY id HAVING COUNT(tag_id) = $tags' : ''}
        ORDER BY added, id`,
    params)
  },

  async unlisted (db, options) {
    let { params, match } = prep(options)
    return search(db, `
      SELECT id
        FROM items
          LEFT OUTER JOIN trash USING (id)
          ${params.$tags ? 'JOIN taggings USING (id)' : ''}
        WHERE
          id NOT IN (SELECT id FROM list_items WHERE deleted IS NULL) AND
          ${match ? `id IN (${match}) AND` : ''}
          ${params.$tags ? 'tag_id IN (SELECT value FROM json_each($tagIds)) AND' : ''}
          trash.deleted IS NULL
        ${params.$tags ? 'GROUP BY id HAVING COUNT(tag_id) = $tags' : ''}`,
    params)
  },

  // All item ids in an order close to the sort,
  // to seed the sort in JS (see common/order.js).
  // Not for position: lists keep their own order (see list).
  async seed (db, sort) {
    let dir = sort.asc ? 'ASC' : 'DESC'
    let ids = []

    await db.each((sort.column in ORDER) ? `
      SELECT id
        FROM items JOIN subjects USING (id)
        ORDER BY ${ORDER[sort.column]} ${dir} NULLS LAST, id ${dir}` : `
      SELECT items.id AS id
        FROM items
          LEFT OUTER JOIN metadata
            ON (metadata.id = items.id AND property = $sort)
          LEFT OUTER JOIN metadata_values USING (value_id)
        ORDER BY text COLLATE NOCASE ${dir} NULLS LAST, items.id ${dir}`,
    (sort.column in ORDER) ? {} : { $sort: sort.column },
    ({ id }) => { ids.push(id) })

    return ids
  },

  async load (db, ids) {
    const items = {}
    const params = (ids != null) ? { $ids: JSON.stringify(ids) } : {}

    await Promise.all([
      db.each(`
        SELECT
            id,
            template,
            strftime("%Y-%m-%dT%H:%M:%f", created, "localtime") AS created,
            strftime("%Y-%m-%dT%H:%M:%f", modified, "localtime") AS modified,
            deleted
          FROM subjects
            JOIN items USING (id)
            LEFT OUTER JOIN trash USING (id)${
              (ids != null) ? ' WHERE id IN (SELECT value FROM json_each($ids))' : ''
            }`, params,
      ({ id, created, modified, deleted, ...data }) => {
        data.created = new Date(created)
        data.modified = new Date(modified)
        data.deleted = !!deleted

        if (id in items) Object.assign(items[id], data)
        else items[id] = Object.assign(skel(id), data)
      }
      ),

      db.each(`
        SELECT id, tag_id AS tag
          FROM taggings${
            (ids != null) ? ' WHERE id IN (SELECT value FROM json_each($ids))' : ''
          }`, params,
      ({ id, tag }) => {
        if (id in items) items[id].tags.push(tag)
        else items[id] = skel(id, [], [], [tag])
      }
      ),

      db.each(`
        SELECT id AS photo, item_id AS id
          FROM photos
            LEFT OUTER JOIN trash USING (id)
          WHERE ${(ids != null) ?
            'item_id IN (SELECT value FROM json_each($ids)) AND' : ''}
            deleted IS NULL
          ORDER BY item_id, position, id`, params,
      ({ id, photo }) => {
        if (id in items) items[id].photos.push(photo)
        else items[id] = skel(id, [], [photo])
      }
      ),

      db.each(`
        SELECT id, list_id AS list
          FROM list_items${
            (ids != null) ? ' WHERE id IN (SELECT value FROM json_each($ids))' : ''
          }`, params,
      ({ id, list }) => {
        if (id in items) items[id].lists.push(list)
        else items[id] = skel(id, [list])
      }
      )
    ])

    return items
  },

  async create (db, template, data) {
    const { id } = await mod.subject.create(db, { template })

    await db.run(`
      INSERT INTO items (id) VALUES (?)`, id)

    if (data) {
      await mod.metadata.update(db, { id, data })
    }

    return (await mod.item.load(db, [id]))[id]
  },

  async dup (db, source) {
    const { id } = await mod.subject.dup(db, source)
    await db.run(`
      INSERT INTO items (id) VALUES (?)`, id)

    await Promise.all([
      mod.metadata.copy(db, { source, target: id }),
      mod.item.tags.copy(db, { source, target: id }),
      mod.item.lists.copy(db, { source, target: id })
    ])

    return (await mod.item.load(db, [id]))[id]
  },

  update (db, id, data, timestamp = Date.now()) {
    return mod.subject.update(db, { id, template: data.template, timestamp })
  },

  async merge (db, item, items, metadata) {
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

    await Promise.all([
      mod.photo.merge(db, item.id, photos, item.photos.length),
      mod.item.tags.set(db, tags.map(tag => ({ id: item.id, tag }))),
      mod.item.lists.merge(db, item.id, ids, lists),
      mod.metadata.update(db, { id: [item.id], data }),
      mod.item.delete(db, ids, 'auto')
    ])

    return {
      photos, tags, lists, data
    }
  },

  split (db, id, items, data, lists, tags) {
    return Promise.all([
      mod.photo.split(db, id, items),
      mod.item.tags.remove(db, { id, tags }),
      mod.item.lists.remove(db, id, lists),
      mod.metadata.replace(db, { id, data }),
      mod.item.restore(db, items.map(i => i.id))
    ])
  },

  implode (db, { id, photos, items }) {
    return Promise.all([
      mod.photo.move(db, { ids: photos, item: id }),
      mod.photo.order(db, id, photos),
      mod.item.delete(db, items, 'auto')
    ])
  },

  delete (db, ids, $reason = 'user') {
    return db.run(`
      INSERT INTO trash (id, reason)
        SELECT value, $reason FROM json_each($ids)`, {
      $ids: JSON.stringify(ids),
      $reason
    })
  },

  restore (db, ids) {
    return db.run(`
      DELETE FROM trash WHERE id IN (SELECT value FROM json_each(?))`,
    JSON.stringify(ids))
  },

  destroy (db, ids) {
    return mod.subject.destroy(db, ids)
  },

  async prune (db, since = '-1 month') {
    let morituri = select('id').from('trash').join('items', { using: 'id' })

    if (since)
      morituri.where(`deleted < datetime("now", "${since}")`)

    let items = (await db.all(...morituri)).map(({ id }) => id)
    await mod.item.destroy(db, items)

    return items
  },

  tags: {
    async add (db, { id, tag }) {
      return db.run(`
        INSERT INTO taggings (tag_id, id)
          SELECT ?, value FROM json_each(?)`, [tag, JSON.stringify(id)])
    },

    async set (db, values) {
      for (let { tag, id } of values) {
        await db.run(`
          INSERT INTO taggings (tag_id, id) VALUES (?, ?)`, [tag, id])
      }
    },

    async clear (db, id) {
      return db.run('DELETE FROM taggings WHERE id = ?', id)
    },

    async remove (db, { id, tags }) {
      return db.run(`
        DELETE FROM taggings
          WHERE id IN (SELECT value FROM json_each(?))
            AND tag_id IN (SELECT value FROM json_each(?))`, [
        JSON.stringify(array(id)),
        JSON.stringify(tags)
      ])
    },

    async copy (db, { source, target }) {
      return db.run(`
        INSERT INTO taggings (tag_id, id)
          SELECT tag_id, ? AS id
            FROM taggings WHERE id = ?`, [target, source])
    }
  },

  lists: {
    async merge (db, id, items, lists) {
      return db.run(`
        INSERT INTO list_items (list_id, id, position, added)
          SELECT list_id, ? AS id, position, added
            FROM list_items li
            WHERE list_id IN (SELECT value FROM json_each(?))
              AND li.id IN (SELECT value FROM json_each(?))
              AND deleted IS NULL
            GROUP BY list_id`, [id, JSON.stringify(lists), JSON.stringify(items)])
    },

    async remove (db, id, lists) {
      return db.run(`
        DELETE FROM list_items
          WHERE id = ?
            AND list_id IN (SELECT value FROM json_each(?))`, [
        id,
        JSON.stringify(lists)
      ])
    },

    async copy (db, { source, target }) {
      return db.run(`
        INSERT INTO list_items (list_id, id, position, added)
          SELECT list_id, ? AS id, position, added
            FROM list_items WHERE id = ?`, [target, source])
    }
  }
}

export default mod.item
