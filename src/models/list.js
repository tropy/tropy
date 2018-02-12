'use strict'

const { all } = require('bluebird')
const { ROOT } = require('../constants/list')
const { select } = require('../common/query')
const { remove } = require('../common/util')

function sort(children) {
  return children ?
    children
    .split(/,/)
    .reduce((res, nxt) => {
      const [pos, id] = nxt.split(/:/).map(Number)
      res[pos - 1] = id // TODO ensure positions are unique!
      return res
    }, []) : []

}

module.exports = {

  async all(db) {
    const lists = {}

    await db.each(`
      SELECT l1.list_id AS id, l1.name, l1.parent_list_id AS parent,
        group_concat(l2.position || ':' || l2.list_id) AS children
      FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
      GROUP BY l1.list_id`,
      ({ id, children, ...list }) => {
        lists[id] = { id, children: sort(children), ...list }
      })

    return lists
  },

  async create(db, { name, parent, position }) {
    const { id } = await db.run(
      'INSERT INTO lists (name, parent_list_id, position) VALUES (?, ?, ?)',
      name, parent, position)

    return { id, name, parent }
  },

  remove(db, id) {
    return db.run(
      'UPDATE lists SET parent_list_id = NULL WHERE list_id = ?', id)
  },

  restore(db, id, parent) {
    return db.run(
      'UPDATE lists SET parent_list_id = ? WHERE list_id = ?', parent, id)
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
      'UPDATE lists SET name = ?, modified = datetime("now") WHERE list_id = ?',
      name, id)
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
      return db.run(`
        UPDATE list_items SET deleted = datetime("now")
          WHERE list_id = ? AND id IN (${items.map(Number).join(',')})`, id)
    },

    restore(db, id, items) {
      return db.run(`
        UPDATE list_items SET deleted = NULL
          WHERE list_id = ? AND id IN (${items.map(Number).join(',')})`, id)
    }
  }
}
