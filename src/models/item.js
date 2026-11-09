import { array, blank, uniq } from '../common/util.js'
import { NAV } from '../constants/index.js'
import sql, { IN } from '../common/sql.js'
import { foldText } from '../common/matcher.js'

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

// The subjects (items, photos, selections) matching a term, per scope:
// FTS matches in the metadata and transcription indices (transcriptions
// count for their subject), and items with a tag whose name contains
// the term (matched in JS: see term). Notes match in their own index (see NOTES).
// Subject ids only: mapping them to items, deduping and leaving out
// trashed photos and selections happens in JS, from state, where it is
// cheap (in SQL these took most of a term's time).
const SUBJECTS = {
  transcription: ({ fts }) => sql`
    SELECT t.id
      FROM fts_transcriptions
        JOIN transcriptions t ON t.transcription_id = fts_transcriptions.rowid
      WHERE fts_transcriptions MATCH ${fts} AND t.deleted IS NULL`,

  metadata: ({ fts }) => sql`
    SELECT m.id
      FROM fts_metadata JOIN metadata m ON m.value_id = fts_metadata.rowid
      WHERE fts_metadata MATCH ${fts}`,

  // The tags whose names match, found in JS (see term).
  tag: ({ tags }) => sql`
    SELECT id FROM taggings WHERE tag_id ${IN(tags)}`
}

// The notes matching a term.
const NOTES = ({ fts }) => sql`
  SELECT n.note_id
    FROM fts_notes JOIN notes n ON n.note_id = fts_notes.rowid
    WHERE fts_notes MATCH ${fts} AND n.deleted IS NULL`

// The folded names of all tags ([id, name]), once per tags object
// (state.tags changes only with the tags): ~7 ms for 2,000 tags.
const FOLDED = new WeakMap()

const foldedTags = (tags) => {
  let folded = FOLDED.get(tags)

  if (folded == null) {
    folded = Object.values(tags).map(tag => [tag.id, foldText(tag.name)])
    FOLDED.set(tags, folded)
  }

  return folded
}

const union = (fragments) =>
  fragments.reduce((a, b) => sql`${a} UNION ALL ${b}`)

const NONE = new Int32Array(0)

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

// A term (see common/search.js) as an FTS5 phrase (prefix or exact):
// user input is never FTS5 syntax. Neither words nor phrases contain
// quotes, so quoting them is safe.
const match = ({ text, prefix, scope }) => ({
  scope,
  fts: `"${text}"${prefix ? '*' : ''}`
})

// Returns the ids of a query (with an id column) as an array,
// in the given order (an ORDER BY fragment), else in any order.
// One JSON array, not a row each: per-row callbacks cost ~40 ms
// of main thread at 10^5, parsing the array ~1 ms. Not indexed:
// most callers filter it; indexing 10^5 ids costs ~6 ms.
async function search (db, query, order = sql``) {
  let { ids } = await db.get(sql`
    SELECT json_group_array(id ${order}) AS ids FROM (${query})`)

  return { items: JSON.parse(ids) }
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
      SELECT id, added
        FROM list_items
        WHERE list_id = ${list} AND deleted IS NULL
          AND id NOT IN (SELECT id FROM trash) ${TAGGED(tags)}`,
    sql`ORDER BY added, id`)
  },

  async unlisted (db, { tags } = {}) {
    return search(db, sql`
      SELECT id
        FROM items
        WHERE id NOT IN (SELECT id FROM list_items WHERE deleted IS NULL)
          AND id NOT IN (SELECT id FROM trash) ${TAGGED(tags)}`)
  },

  // The subjects and notes matching a term (see SUBJECTS, NOTES),
  // as Int32Arrays: { subjects, notes }. Terms are combined per item
  // in JS (see common/matches.js). Tag names are matched here, in JS,
  // folded like the highlights (common/matcher.js): `tags` are all
  // tags (id → { id, name }), as in state.
  async term (db, term, tags = {}) {
    let m = match(term)
    let any = (m.scope === 'any')

    if (any || m.scope === 'tag') {
      let text = foldText(term.text)
      m.tags = foldedTags(tags)
        .filter(([, name]) => name.includes(text))
        .map(([id]) => id)
    } else {
      m.tags = []
    }

    let sources = Object.entries(SUBJECTS)
      .filter(([scope]) => any || scope === m.scope)
      .filter(([scope]) => scope !== 'tag' || m.tags.length > 0)
      .map(([, source]) => source)

    let [subjects, notes] = await Promise.all([
      (sources.length > 0) ?
        db.ids(union(sources.map(source => source(m)))) : NONE,
      (any || m.scope === 'note') ? db.ids(NOTES(m)) : NONE
    ])

    return { subjects, notes }
  },

  // All item ids in an order close to the sort,
  // to seed the sort in JS (see common/order.js).
  // Not for position: lists keep their own order (see list).
  // One JSON array, not a row each (see search).
  async seed (db, sort) {
    let dir = sql.raw(sort.asc ? 'ASC' : 'DESC')

    let { ids } = await db.get((sort.column in ORDER) ? sql`
      SELECT json_group_array(id ORDER BY
          ${sql.raw(ORDER[sort.column])} ${dir} NULLS LAST, id ${dir}) AS ids
        FROM items JOIN subjects USING (id)` : sql`
      SELECT json_group_array(items.id ORDER BY
          text COLLATE NOCASE ${dir} NULLS LAST, items.id ${dir}) AS ids
        FROM items
          LEFT OUTER JOIN metadata
            ON (metadata.id = items.id AND property = ${sort.column})
          LEFT OUTER JOIN metadata_values USING (value_id)`)

    return JSON.parse(ids)
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
