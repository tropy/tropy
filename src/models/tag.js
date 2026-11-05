import assert from 'node:assert'
import { pick } from '../common/util.js'
import { select } from '../common/query.js'
import sql, { IN, SET, VALUES } from '../common/sql.js'

const COLUMNS = [
  'name',
  'color',
  'created',
  'modified'
]

async function load (db, ids) {
  let tags = {}
  await db.each(
    ...select({ id: 'tag_id' }, ...COLUMNS)
      .from('tags')
      .where({ tag_id: ids }),
    (data) => { tags[data.id] = data })

  return tags
}


export default {
  load,

  async create (db, data) {
    let { id } = await db.run(sql`
      INSERT INTO tags ${VALUES(pick(data, COLUMNS, { tag_id: data.id }))}`)

    return (await load(db, [id]))[id]
  },

  async save (db, { id, ...data }) {
    assert(id != null, 'missing tag id')

    for (let key in data)
      assert(key === 'name' || key === 'color', `cannot save ${key}`)

    return db.run(sql`
      UPDATE tags
        ${SET({ ...data, modified: sql`datetime('now')` })}
        WHERE tag_id = ${id}`)
  },

  async delete (db, ids) {
    return db.run(sql`
      DELETE FROM tags WHERE tag_id ${IN(ids)}`)
  },

  async items (db, id) {
    let items = []
    await db.each(
      ...select('id')
        .from('taggings')
        .where({ tag_id: id }),
      (item) => { items.push(item.id) })

    return items
  }
}
