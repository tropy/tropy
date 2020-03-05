'use strict'

module.exports = {
  vocab: {
    id: 'http://example.com/vocab',
    description: 'Description',
    prefix: 'vocab',
    seeAlso: 'http://example.com/seeAlso',
    title: 'Test Vocabulary',
    classes: ['http://example.com/class'],
    properties: ['http://example.com/photo-property'],
    datatypes: ['http://example.com/type']
  },

  class: {
    'http://example.com/class': {
      comment: 'comment',
      description: null,
      id: 'http://example.com/class',
      label: 'My Class'
    }
  },

  props: {
    'http://example.com/custom-property': {
      label: 'Non-template Property'
    },
    'http://example.com/photo-property': {
      id: 'http://example.com/photo-property',
      label: 'hello world'
    },
    'http://example.com/selection-property': {
      label: 'select prop'
    }
  },

  type: {
    'http://example.com/type': {
      id: 'http://example.com/type',
      comment: 'a custom datatype'
    }
  }
}
