'use strict'

const template = {
  id: 'https://tropy.org/v1/tropy#test-template',
  fields: [{
    property: 'http://example.com/property',
    datatype: 'http://example.com/property#datatype',
    label: 'My Label'
  }, {
    property: 'http://example.com/empty-property',
    datatype: 'http://example.com/empty-property#datatype',
    label: 'Empty'
  }]
}

const items = [
  { id: 1, template: 'https://tropy.org/v1/tropy#test-template', photos: [11, 12] }
]

const metadata = {
  // metadata of first item
  1: {
    'http://example.com/property': {
      text: 'value',
      type: 'http://example.com/property#datatype'
    },
    'http://example.com/custom-property': {
      text: 'custom',
      type: 'http://example.com/custom-property#type'
    }
  },
  // metadata of first photo
  11: {
    'http://example.com/photo-property': {
      text: 'photo property',
      type: 'http://example.com/photo-property#type'
    },
    'http://example.com/custom-property': {
      text: 'custom property',
      type: 'http://example.com/custom-property#type'
    }
  },
  // metadata of a selection
  21: {
    'http://example.com/selection-property': {
      text: 'selection property',
      type: 'http://example.com/selection-property#type'
    }
  }
}

const props = {
  'http://example.com/custom-property': { label: 'Non-template Property' },
  'http://example.com/photo-property': { label: 'hello world' },
  'http://example.com/selection-property': { label: 'select prop' }
}

const photos = {
  11: { id: 11, path: '/path' },
  12: { path: '/another', selections: [21] }
}

const vocab = {
  id: 'http://example.com/vocab',
  description: 'Description',
  prefix: 'vocab',
  seeAlso: 'http://example.com/seeAlso',
  title: 'Test Vocabulary'
}

module.exports = {
  template,
  items,
  metadata,
  props,
  photos,
  vocab
}
