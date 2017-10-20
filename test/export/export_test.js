'use strict'

describe('export', () => {
  const { groupedByTemplate } = __require('export')
  const { template, items, metadata, props, photos, lists } =
        require('./helpers')
  const { keys } = Object

  const resources = [
    { template, items, metadata, photos, lists }
  ]

  const ld = groupedByTemplate(resources, props)

  it('has item.template', async () => {
    const data = (await ld)[0]
    expect(data).to.have.property('template', 'https://tropy.org/v1/tropy#test-template')
  })

  it('has item @context', async () => {
    const data = (await ld)[0]

    expect(data['@context']).to.have.deep.property('template', {
      '@id': 'https://tropy.org/v1/tropy#template',
      '@type': '@id'
    })

    expect(data['@context']).to.have.deep.property(
      'myLabel', {
        '@id': 'http://example.com/property',
        '@type': 'http://example.com/property#datatype'
      })
    expect(data['@context']).to.have.deep.property(
      'nonTemplateProperty', {
        '@id': 'http://example.com/custom-property',
        '@type': 'http://example.com/custom-property#type'
      })
  })

  it('has item metadata', async () => {
    const data = (await ld)[0]['@graph'][0]
    expect(data).to.have.property('myLabel', 'value')
    expect(data).to.have.property('nonTemplateProperty', 'custom')
  })

  it('has photo @context', async () => {
    const data = (await ld)[0]['@context']['photo']['@context']

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
    const data = (await ld)[0]['@graph'][0]
    expect(keys(data.photo).length).to.eql(2)
    expect(data.photo[0]).to.eql({
      '@type': 'Photo',
      'path': '/path',
      'helloWorld': 'photo property',
      'nonTemplateProperty': 'custom property'
    })
  })

  it('has photo->selection @context', async () => {
    let data = (await ld)[0]['@context']['photo']
    data = data['@context']['selection']['@context']

    expect(data.selectProp).to.eql({
      '@id': 'http://example.com/selection-property',
      '@type': 'http://example.com/selection-property#type'
    })
    expect(keys(data).length).to.eql(1)
  })

  it('has photo->selection metadata', async () => {
    const data = (await ld)[0]['@graph'][0]['photo'][1]['selection']
    expect(data).to.eql({
      '@type': 'Selection',
      'selectProp': 'selection property'
    })
  })

  describe('item has auxiliary property', () => {
    it('list', async () => {
      const data = (await ld)[0]['item']
      expect(data[0]).to.not.have.property('list')
      expect(data[1]['list']).to.eql(['list1'])
    })
  })
})
