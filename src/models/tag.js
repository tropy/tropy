'use strict'

const { list, pick } = require('../common/util')
const { into, select, update } = require('../common/query')

const COLUMNS = [
  'name',
  'color',
  'created',
  'modified'
]


async function load(db, ids) {
  let tags = {}
  await db.each(
    ...select({ id: 'tag_id' }, ...COLUMNS)
      .from('tags')
      .where({ tag_id: ids }),
    (data) => { tags[data.id] = data })

  return tags
}


module.exports = {
  load,

  async create(db, data) {
    let { id } = await db.run(
      ...into('tags')
        .insert(pick(data, COLUMNS, { tag_id: data.id })))

    return (await load(db, [id]))[id]
  },

  async save(db, { id, ...data }) {
    return db.run(
      ...update('tags')
        .set(data)
        .set('modified = datetime("now")')
        .where({ tag_id: id }))
  },

  async delete(db, ids) {
    return db.run(`
      DELETE FROM tags WHERE tag_id IN (${list(ids)})`)
  },

  async items(db, id) {
    let items = []
    await db.each(
      ...select('id')
        .from('taggings')
        .where({ tag_id: id }),
      (item) => { items.push(item.id) })

    return items
  }
}
