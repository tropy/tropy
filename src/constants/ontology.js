'use strict'

const { join } = require('path')

module.exports = {
  IMPORT: 'ontology.import',
  LOAD: 'ontology.load',

  DB: 'ontology.db',
  SCHEMA: join(__dirname, '..', '..', 'db', 'schema', 'ontology.sql'),

  PROPS: {
    LOAD: 'ontology.props.load'
  },

  CLASS: {
    LOAD: 'ontology.class.load'
  },

  LABEL: {
    SAVE: 'ontology.label.save'
  },

  TEMPLATE: {
    DELETE: 'ontology.template.delete',
    IMPORT: 'ontology.template.import',
    LOAD: 'ontology.template.load',
    SAVE: 'ontology.template.save',
    CONTEXT: 'https://tropy.org/schema/v1/contexts/template.jsonld'
  },

  VOCAB: {
    DELETE: 'ontology.vocab.delete',
    LOAD: 'ontology.vocab.load',
    RESTORE: 'ontology.vocab.restore',
    SAVE: 'ontology.vocab.save'
  }
}
