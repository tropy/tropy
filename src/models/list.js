'use strict'

const { all } = require('bluebird')
const { ROOT } = require('../constants/list')
const { into, select, update } = require('../common/query')
const { remove } = require('../common/util')

module.exports = {
  async all(db) {
    let lists = {}

    await db.each(
      ...select({ id: 'list_id', parent: 'parent_list_id' }, 'name')
        .from('lists')
        .order('parent, position'),
      ({ id, parent, name }) => {
        lists[id] = {
          id, parent, name, children: [], ...lists[id]
        }

        if (parent != null) {
          if (!(parent in lists)) {
            lists[parent] = { id: parent, children: [] }
          }
          lists[parent].children.push(id)
        }
      })

    return lists
  },

  async create(db, { name, parent, position }) {
    let { id } = await db.run(
      ...into('lists')
        .insert({ name, parent_list_id: parent, position }))

    return { id, name, parent, children: [] }
  },

  remove(db, id) {
    return db.run(
      ...update('lists')
        .set({ parent_list_id: null })
        .where({ list_id: id }))
  },

  restore(db, id, parent) {
    return db.run(
      ...update('lists')
        .set({ parent_list_id: parent })
        .where({ list_id: id }))
  },

  prune(db) {
    return db.seq(conn => all([
      conn.run(
        'DELETE FROM lists WHERE list_id != ? AND parent_list_id IS NULL', ROOT
      ),
      conn.run('DELETE FROM list_items WHERE deleted NOT NULL')
    ]))
  },

  save(db, { id, name }) {
    return db.run(
      ...update('lists')
        .set({ name })
        .set('modified = datetime("now")')
        .where({ list_id: id }))
  },

  order(db, parent, order) {
    if (order.length) {
      return db.run(`
        UPDATE lists
        SET position = CASE list_id
          ${order.map((_, idx) => (`WHEN ? THEN ${idx + 1}`)).join(' ')}
          END
        WHERE parent_list_id = ?`,
        ...order, parent)
    }
  },

  items: {
    async add(db, id, items) {
      const dupes = await db.all(
        ...select('id').from('list_items').where({ list_id: id, id: items }))

      items = remove(items, ...dupes.map(r => r.id))

      const res = (items.length === 0) ? { changes: 0 } :
        await db.run(`
          INSERT INTO list_items (list_id, id) VALUES ${
              items.map(it => `(${Number(id)}, ${it})`).join(',')
            }`)

      return { ...res, items }
    },

    remove(db, id, items) {
      return db.run(
        ...update('list_items')
          .set('deleted = datetime("now")')
          .where({ list_id: id, id: items.map(Number) }))
    },

    restore(db, id, items) {
      return db.run(
        ...update('list_items')
          .set({ deleted: null })
          .where({ list_id: id, id: items.map(Number) }))
    }
  }
}
