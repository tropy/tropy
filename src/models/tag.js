'use strict'

const { list, pick } = require('../common/util')
const { keys, values } = Object
const { into, map } = require('transducers.js')
const mod = {}

module.exports = mod.tag = {

  async load(db, ids) {
    const tags = {}

    await db.each(`
      SELECT tag_id AS id, name, created, modified
        FROM tags${
          (ids != null) ? ` WHERE tag_id IN (${list(ids)})` : ''
        }`,
      (data) => { tags[data.id] = data })

    return tags
  },

  async create(db, data) {
    const attr = pick(data, ['id', 'name', 'created', 'modified'])
    const cols = keys(attr)

    const { id } = await db.run(`
      INSERT INTO tags (${cols.join(',')})
        VALUES (${cols.map(() => '?').join(',')})`,
      ...values(attr))

    return (await mod.tag.load(db, [id]))[id]
  },

  async save(db, { id, name }) {
    return db.run(`
      UPDATE tags
        SET name = ?, modified = datetime("now")
        WHERE tag_id = ?`,
      name, id)
  },

  async delete(db, ids) {
    return db.run(`
      DELETE FROM tags WHERE tag_id IN (${list(ids)})`)
  },

  async items(db, ids) {
    const items = into({}, map(id => ({ [id]: [] })))

    await db.each(`
      SELECT tag_id AS tag, id AS item
        FROM taggings
        WHERE tag_id IN (${list(ids)})`,
      ({ tag, item }) => { items[tag].push(item) })

    return items
  }
}
