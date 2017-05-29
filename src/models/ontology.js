'use strict'

const { join } = require('path')
const SCHEMA = join(
  __dirname, '..', '..', 'db', 'schema', 'ontology.sql'
)

module.exports = {
  create(db) {
    return db.read(SCHEMA)
  }
}
