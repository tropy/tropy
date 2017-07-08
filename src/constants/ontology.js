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

  TYPE: {
    LOAD: 'ontology.type.load'
  },

  LABEL: {
    SAVE: 'ontology.label.save'
  },

  TEMPLATE: {
    CREATE: 'ontology.template.create',
    DELETE: 'ontology.template.delete',
    IMPORT: 'ontology.template.import',
    LOAD: 'ontology.template.load',
    SAVE: 'ontology.template.save',

    FIELD: {
      ADD: 'ontology.template.field.add',
      ORDER: 'ontology.template.field.order',
      REMOVE: 'ontology.template.field.remove',
      SAVE: 'ontology.template.field.save'
    },

    CONTEXT: 'https://tropy.org/v1/contexts/template.jsonld'
  },

  VOCAB: {
    DELETE: 'ontology.vocab.delete',
    LOAD: 'ontology.vocab.load',
    RESTORE: 'ontology.vocab.restore',
    SAVE: 'ontology.vocab.save'
  }
}
