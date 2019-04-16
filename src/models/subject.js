'use strict'

const { array, blank, list } = require('../common/util')

function touch(db, { id, timestamp = Date.now() }) {
  return update(db, { id, timestamp })
}

function update(db, { id, template, timestamp = Date.now() }) {
  let assignments = ['modified = datetime(?)']
  let params = [new Date(timestamp).toISOString()]

  if (!blank(template)) {
    assignments.push('template = ?')
    params.push(template)
  }

  return db.run(`
    UPDATE subjects
      SET ${assignments.join(', ')}
      WHERE id IN (${list(array(id))})`, params)
}

function prune(db) {
  return db.run(`
    DELETE FROM subjects
      WHERE id IN (
        SELECT id FROM trash WHERE reason = 'auto'
      )`)
}

module.exports = {
  prune,
  touch,
  update
}
