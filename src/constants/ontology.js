export default {
  IMPORT: 'ontology.import',
  LOAD: 'ontology.load',

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
    EXPORT: 'ontology.template.export',
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
    EXPORT: 'ontology.vocab.export',
    LOAD: 'ontology.vocab.load',
    RESTORE: 'ontology.vocab.restore',
    SAVE: 'ontology.vocab.save'
  }
}
