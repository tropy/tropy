'use strict'

const { join } = require('path')

module.exports = {
  DB: 'ontology.db',
  SCHEMA: join(__dirname, '..', '..', 'db', 'schema', 'ontology.sql')
}
