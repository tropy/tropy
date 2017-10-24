'use strict'

const { array, blank, list } = require('../common/util')

function touch(db, { id, timestamp = Date.now() }) {
  return update(db, { id, timestamp })
}

function update(db, { id, template, timestamp = Date.now() }) {
  const assignments = ['modified = datetime(?)']
  const params = [new Date(timestamp).toISOString()]

  if (!blank(template)) {
    assignments.push('template = ?')
    params.push(template)
  }

  return db.run(`
    UPDATE subjects
      SET ${assignments.join(', ')}
      WHERE id IN (${list(array(id))})`, params)
}

module.exports = {
  touch,
  update
}
