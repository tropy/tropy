'use strict'

describe('export', () => {
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
    { id: 1, template: 'https://tropy.org/v1/tropy#test-template', photos: [11, 12] }
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

  const photos = { 11: { path: '/path' }, 12: { path: '/another' } }

  const resources = [
    { template, items, metadata, photos }
  ]

  const ld = groupedByTemplate(resources, props)

  it('has item/photo metadata', async () => {
    const data = (await ld)[0]
    expect(data.item).to.eql([{
      myLabel: 'value',
      nonTemplateProperty: 'custom',
      photo: [{ path: '/path' }, { path: '/another' }]
    }])
  })

  it('has @context', async () => {
    const data = (await ld)[0]

    expect(data['@context']).to.have.property('@vocab')
    expect(data['@context']).to.have.property('template')

    expect(data['@context']['item']['@context']).to.have.deep.property(
      'myLabel', {
        '@id': 'http://example.com/property',
        '@type': 'http://example.com/property#datatype'
      })
    expect(data['@context']['item']['@context']).to.have.deep.property(
      'nonTemplateProperty', {
        '@id': 'http://example.com/custom-property',
        '@type': 'http://example.com/custom-property#type'
      })
  })

  it('has item.template', async () => {
    const data = (await ld)[0]
    expect(data).to.have.property('template', 'https://tropy.org/v1/tropy#test-template')
  })
})
