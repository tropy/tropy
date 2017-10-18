'use strict'

describe('groupedByTemplate', async () => {
  const { groupedByTemplate } = __require('export')

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
    { id: 1, template: 'https://tropy.org/v1/tropy#test-template' }
  ]

  const metadata = {
    1: {
      'http://example.com/property': { text: 'value' },
      'http://example.com/custom-property': {
        text: 'custom', type: 'http://example.com/custom-property#type'
      }
    }
  }

  const props = {
    'http://example.com/custom-property': { label: 'Non-template Property' }
  }

  const resources = [
    { template, items, metadata }
  ]

  const ld = groupedByTemplate(resources, props)
  const data = (await ld)[0]

  it('metadata', () => {
    expect(data.items).to.eql([{
      myLabel: 'value',
      nonTemplateProperty: 'custom'
    }])
  })

  it('context', () => {
    expect(data['@context']).to.have.property('@vocab')
    expect(data['@context']).to.have.property('template')

    expect(data['@context']['items']['@context']).to.eql({
      myLabel: {
        '@id': 'http://example.com/property',
        '@type': 'http://example.com/property#datatype'
      },
      nonTemplateProperty: {
        '@id': 'http://example.com/custom-property',
        '@type': 'http://example.com/custom-property#type'
      }
    })
  })

  it('template', () => {
    expect(data).to.have.property('template', 'https://tropy.org/v1/tropy#test-template')
  })
})

describe('', () => {
  it('async function test cannot be only one in file?', () => {
  })
})
