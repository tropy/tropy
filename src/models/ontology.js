'use strict'

const { SCHEMA } = require('../constants/ontology')

module.exports = {
  create(db) {
    return db.read(SCHEMA)
  }
}
