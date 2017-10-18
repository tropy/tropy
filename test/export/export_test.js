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
    // metadata of first item
    1: {
      'http://example.com/property': { text: 'value' },
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
    }
  }

  const props = {
    'http://example.com/custom-property': { label: 'Non-template Property' },
    'http://example.com/photo-property': { label: 'hello world' }
  }

  const photos = { 11: { id: 11, path: '/path' }, 12: { path: '/another' } }

  const resources = [
    { template, items, metadata, photos }
  ]

  const ld = groupedByTemplate(resources, props)

  it('has item.template', async () => {
    const data = (await ld)[0]
    expect(data).to.have.property('template', 'https://tropy.org/v1/tropy#test-template')
  })

  it('has item @context', async () => {
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

  it('has item metadata', async () => {
    const data = (await ld)[0]['item'][0]
    expect(data).to.have.property('myLabel', 'value')
    expect(data).to.have.property('nonTemplateProperty', 'custom')
  })

  it('has photo @context', async () => {
    const data =
          (await ld)[0]['@context']['item']['@context']['photo']['@context']

    expect(data.path).to.equal('http://schema.org/image')
    expect(data.nonTemplateProperty).to.eql({
      '@id': 'http://example.com/custom-property',
      '@type': 'http://example.com/custom-property#type'
    })
    expect(data.helloWorld).to.eql({
      '@id': 'http://example.com/photo-property',
      '@type': 'http://example.com/photo-property#type'
    })
  })

  it('has photo metadata', async () => {
    const data = (await ld)[0]['item'][0]
    expect(data.photo).to.eql([
      {
        path: '/path',
        helloWorld: 'photo property',
        nonTemplateProperty: 'custom property'
      },
      { path: '/another' }
    ])
  })
})
