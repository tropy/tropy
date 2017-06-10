'use strict'

const { join } = require('path')

module.exports = {
  IMPORT: 'ontology.import',

  DB: 'ontology.db',
  SCHEMA: join(__dirname, '..', '..', 'db', 'schema', 'ontology.sql'),

  PROPS: {
    LOAD: 'ontology.props.load'
  },

  TYPES: {
    LOAD: 'ontology.types.load'
  },

  VOCAB: {
    LOAD: 'ontology.vocab.load'
  }
}
