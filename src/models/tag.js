'use strict'

const assert = require('assert')
const { list, pick } = require('../common/util')
const { keys, values } = Object
const mod = {}

module.exports = mod.tag = {

  async load(db, ids) {
    const tags = {}

    await db.each(`
      SELECT tag_id AS id, name, color, created, modified
        FROM tags${
          (ids != null) ? ` WHERE tag_id IN (${list(ids)})` : ''
        }`,
      (data) => { tags[data.id] = data })

    return tags
  },

  async create(db, data) {
    const attr = pick(data, ['tag_id', 'name', 'created', 'modified'])
    const cols = keys(attr)

    const { id } = await db.run(`
      INSERT INTO tags (${cols.join(',')})
        VALUES (${cols.map(() => '?').join(',')})`,
      ...values(attr))

    return (await mod.tag.load(db, [id]))[id]
  },

  async save(db, { id, ...data }) {
    const assign = []
    const params = { $id: id }

    for (let attr in data) {
      assign.push(`${attr} = $${attr}`)
      params[`$${attr}`] = data[attr]
    }

    assert(id != null, 'missing tag id')
    assert(assign.length > 0, 'missing valid assignments')

    return db.run(`
      UPDATE tags
        SET ${assign.join(', ')}, modified = datetime("now")
        WHERE tag_id = $id`, params)
  },

  async delete(db, ids) {
    return db.run(`
      DELETE FROM tags WHERE tag_id IN (${list(ids)})`)
  },

  async items(db, id) {
    const items = []

    await db.each(`
      SELECT id FROM taggings WHERE tag_id = ?`, id,
      (item) => { items.push(item.id) })

    return items
  }
}
