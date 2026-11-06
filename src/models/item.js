import { array, blank, uniq } from '../common/util.js'
import { NAV } from '../constants/index.js'
import { createSequence } from '../common/sequence.js'
import sql, { IN } from '../common/sql.js'

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

// The item of subject x.id: the item itself, or a photo's or selection's.
// Trashed photos and selections (and selections of trashed photos)
// contribute nothing; trashed items do (the trash can be searched).
const OF_ITEM = sql`
      LEFT JOIN items i ON i.id = x.id
      LEFT JOIN photos p ON p.id = x.id
      LEFT JOIN selections s ON s.id = x.id
      LEFT JOIN photos sp ON sp.id = s.photo_id
    WHERE i.id IS NOT NULL OR (
      x.id NOT IN (SELECT id FROM trash) AND
      coalesce(sp.id, 0) NOT IN (SELECT id FROM trash))`

const ITEM = sql.raw('coalesce(i.id, p.item_id, sp.item_id)')

// Hit rows (term, item, subject, note) for term k: the subjects
// (items, photos, selections) and notes matching it in any FTS index,
// and the items with a tag whose name contains it.
// Transcriptions count for their subject.
const HIT = ({ fts, tag }, k) => sql`
  SELECT ${k} AS term, ${ITEM} AS item, x.id AS subject, NULL AS note
    FROM (
      SELECT t.id
        FROM fts_transcriptions
          JOIN transcriptions t ON t.transcription_id = fts_transcriptions.rowid
        WHERE fts_transcriptions MATCH ${fts} AND t.deleted IS NULL
    ) x ${OF_ITEM}
  UNION ALL
  SELECT ${k}, ${ITEM}, x.id, x.note
    FROM (
      SELECT n.id, n.note_id AS note
        FROM fts_notes JOIN notes n ON n.note_id = fts_notes.rowid
        WHERE fts_notes MATCH ${fts} AND n.deleted IS NULL
    ) x ${OF_ITEM}
  UNION ALL
  SELECT ${k}, ${ITEM}, x.id, NULL
    FROM (
      SELECT m.id
        FROM fts_metadata JOIN metadata m ON m.value_id = fts_metadata.rowid
        WHERE fts_metadata MATCH ${fts}
    ) x ${OF_ITEM}
  UNION ALL
  SELECT ${k}, ${ITEM}, x.id, NULL
    FROM (
      SELECT id
        FROM taggings JOIN tags USING (tag_id)
        WHERE name LIKE ${tag} ESCAPE '\\'
    ) x ${OF_ITEM}`

// The hit rows of the items matching every term:
// terms are ANDed per item, not per FTS document,
// so they can match different fields, notes, transcriptions or tags.
const HITS = (terms) => sql`
  WITH hits AS (${terms.map(HIT).reduce((a, b) => sql`${a} UNION ALL ${b}`)})
  SELECT DISTINCT item, subject, note
    FROM hits
    WHERE item IN (
      SELECT item FROM hits GROUP BY item
        HAVING count(DISTINCT term) = ${terms.length})`

// Restricts a view to the items with every tag.
const TAGGED = (tags) => {
  tags = uniq(array(tags))

  return blank(tags) ? sql`` : sql`
    AND id IN (
      SELECT id FROM taggings WHERE tag_id ${IN(tags)}
        GROUP BY id HAVING count(*) = ${tags.length})`
}

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

// Terms as FTS5 phrases (prefix or exact) and tag name patterns.
function match (query) {
  return ((query == null) ? [] : parse(query)).map(({ text, prefix }) => ({
    fts: `"${text}"${prefix ? '*' : ''}`,
    tag: `%${text.replace(/[\\%_]/g, '\\$&')}%`
  }))
}

async function search (db, query) {
  const [items, push] = createSequence()

  await db.each(query, ({ id }) => {
    push(id)
  })

  return { items: Object.freeze(items) }
}


mod.item = {
  // The view queries return the items of a view, as a set
  // (list returns list order); terms are matched by hits.
  all (db, { tags } = {}) {
    return search(db, sql`
      SELECT id
        FROM items
        WHERE id NOT IN (SELECT id FROM trash) ${TAGGED(tags)}`)
  },

  async find (db, { ids }) {
    return search(db, sql`
      SELECT id
        FROM items
        WHERE id ${IN(ids)} AND id NOT IN (SELECT id FROM trash)`)
  },

  async trash (db) {
    return search(db, sql`
      SELECT id
        FROM items JOIN trash USING (id)
        WHERE reason = 'user'`)
  },

  // In list order: the order when sorting by position.
  async list (db, list, { tags } = {}) {
    return search(db, sql`
      SELECT id
        FROM list_items
        WHERE list_id = ${list} AND deleted IS NULL
          AND id NOT IN (SELECT id FROM trash) ${TAGGED(tags)}
        ORDER BY added, id`)
  },

  async unlisted (db, { tags } = {}) {
    return search(db, sql`
      SELECT id
        FROM items
        WHERE id NOT IN (SELECT id FROM list_items WHERE deleted IS NULL)
          AND id NOT IN (SELECT id FROM trash) ${TAGGED(tags)}`)
  },

  // The hit rows ({ item, subject, note }) of the items matching
  // every term of the query (see HITS), or null without terms.
  // Item level hits (item metadata, tags) have the item as subject.
  async hits (db, query) {
    let terms = match(query)

    if (terms.length === 0)
      return null

    return db.all(HITS(terms))
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
    const where = (col) => (ids != null) ?
      sql`WHERE ${sql.id(col)} ${IN(ids)}` : sql``

    await Promise.all([
      db.each(sql`
        SELECT
            id,
            template,
            strftime('%Y-%m-%dT%H:%M:%f', created, 'localtime') AS created,
            strftime('%Y-%m-%dT%H:%M:%f', modified, 'localtime') AS modified,
            deleted
          FROM subjects
            JOIN items USING (id)
            LEFT OUTER JOIN trash USING (id)
          ${where('id')}`,
      ({ id, created, modified, deleted, ...data }) => {
        data.created = new Date(created)
        data.modified = new Date(modified)
        data.deleted = !!deleted

        if (id in items) Object.assign(items[id], data)
        else items[id] = Object.assign(skel(id), data)
      }
      ),

      db.each(sql`
        SELECT id, tag_id AS tag
          FROM taggings
          ${where('id')}`,
      ({ id, tag }) => {
        if (id in items) items[id].tags.push(tag)
        else items[id] = skel(id, [], [], [tag])
      }
      ),

      db.each(sql`
        SELECT id AS photo, item_id AS id
          FROM photos
            LEFT OUTER JOIN trash USING (id)
          ${where('item_id')}
          ${(ids != null) ? sql`AND` : sql`WHERE`} deleted IS NULL
          ORDER BY item_id, position, id`,
      ({ id, photo }) => {
        if (id in items) items[id].photos.push(photo)
        else items[id] = skel(id, [], [photo])
      }
      ),

      db.each(sql`
        SELECT id, list_id AS list
          FROM list_items
          ${where('id')}`,
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

  delete (db, ids, reason = 'user') {
    return db.run(sql`
      INSERT INTO trash (id, reason)
        SELECT value, ${reason} FROM json_each(${ids})`)
  },

  restore (db, ids) {
    return db.run(sql`
      DELETE FROM trash WHERE id ${IN(ids)}`)
  },

  destroy (db, ids) {
    return mod.subject.destroy(db, ids)
  },

  async prune (db, since = '-1 month') {
    let items = (await db.all(`
      SELECT id
        FROM trash JOIN items USING (id)
        WHERE $since IS NULL OR deleted < datetime('now', $since)`, {
      $since: since || null
    })).map(({ id }) => id)
    await mod.item.destroy(db, items)

    return items
  },

  tags: {
    async add (db, { id, tag }) {
      return db.run(sql`
        INSERT INTO taggings (tag_id, id)
          SELECT ${tag}, value FROM json_each(${id})`)
    },

    async set (db, values) {
      return db.run(sql`
        INSERT INTO taggings (tag_id, id)
          SELECT value ->> 'tag', value ->> 'id' FROM json_each(${values})`)
    },

    async clear (db, id) {
      return db.run('DELETE FROM taggings WHERE id = ?', id)
    },

    async remove (db, { id, tags }) {
      return db.run(sql`
        DELETE FROM taggings
          WHERE id ${IN(array(id))}
            AND tag_id ${IN(tags)}`)
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
      return db.run(sql`
        INSERT INTO list_items (list_id, id, position, added)
          SELECT list_id, ${id} AS id, position, added
            FROM list_items li
            WHERE list_id ${IN(lists)}
              AND li.id ${IN(items)}
              AND deleted IS NULL
            GROUP BY list_id`)
    },

    async remove (db, id, lists) {
      return db.run(sql`
        DELETE FROM list_items
          WHERE id = ${id}
            AND list_id ${IN(lists)}`)
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
