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
  {
    id: 1,
    template: 'https://tropy.org/v1/tropy#test-template',
    photos: [11, 12]
  },
  {
    id: 2,
    template: 'https://tropy.org/v1/tropy#test-template',
    lists: [1],
    tags: [1]
  }
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
  'http://example.com/photo-property': {
    id: 'http://example.com/photo-property',
    label: 'hello world'
  },
  'http://example.com/selection-property': { label: 'select prop' },
}

const photos = {
  11: { id: 11, path: '/path' },
  12: { id: 12, path: '/another', selections: [21], notes: [1] }
}

const vocab = {
  id: 'http://example.com/vocab',
  description: 'Description',
  prefix: 'vocab',
  seeAlso: 'http://example.com/seeAlso',
  title: 'Test Vocabulary',
  classes: ['http://example.com/class'],
  properties: ['http://example.com/photo-property'],
  datatypes: ['http://example.com/type']
}

const classes = {
  'http://example.com/class': {
    comment: 'comment',
    description: null,
    id: 'http://example.com/class',
    label: 'My Class'
  }
}

const datatypes = {
  'http://example.com/type': {
    id: 'http://example.com/type',
    comment: 'a custom datatype'
  }
}

const lists = {
  1: { name: 'list1' }
}

const tags = {
  1: { name: 'mytag' }
}

const notes = {
  1: { text: 'photo note', state: { doc: { foo: 'bar' } } },
  2: { text: 'selection note' }
}

module.exports = {
  template,
  items,
  metadata,
  props,
  photos,
  vocab,
  classes,
  datatypes,
  lists,
  tags,
  notes
}
