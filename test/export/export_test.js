'use strict'

describe('export', () => {
  const { groupedByTemplate } = __require('export')
  const f = require('../fixtures/export')

  const { keys } = Object

  const resources = [
    f.props, f.metadata, f.photos, f.lists, f.tags, f.notes, f.selections]

  const ld = groupedByTemplate(
    [{ template: f.template, items: f.items }], resources)

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
    const photo = data.photo[0]
    expect(photo).to.have.property('@type', 'Photo')
    expect(photo).to.have.property('path', '/path')
    expect(photo).to.have.property('helloWorld', 'photo property')
    expect(photo).to.have.property('nonTemplateProperty', 'custom property')
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
    const data = (await ld)[0]['@graph'][0]['photo'][1]['selection'][0]
    expect(data).to.have.property('@type', 'Selection')
    expect(data).to.have.property('selectProp', 'selection property')
  })

  describe('item has', () => {
    it('list', async () => {
      const data = (await ld)[0]['@graph']
      expect(data[0]).to.not.have.property('list')
      expect(data[1]['list']).to.eql('list1')
    })

    it('tag', async () => {
      const data = (await ld)[0]['@graph']
      expect(data[0]).to.not.have.property('tag')
      expect(data[1]['tag']).to.eql('mytag')
    })
  })

  describe('photo has', () => {
    it('note', async () => {
      const item1 = (await ld)[0]['@graph'][0]
      const { html, text } = item1.photo[1]['note'][0]

      expect(item1.photo[0]).to.not.have.property('note')
      expect(text['@value']).to.eql('photo note')
      expect(text['@language']).to.eql('de')
      expect(html['@value']).to.eql('<p>photo note</p>')
      expect(html['@language']).to.eql('de')
    })

    it('width, etc.', async () => {
      const item1 = (await ld)[0]['@graph'][0]
      expect(item1.photo[1]).to.not.have.property('width')
      const photo = item1.photo[0]
      expect(photo).to.have.property('width', 30)
      expect(photo).to.have.property('height', 40)
    })
  })

  describe('selection has', async () => {
    const s = (await ld)[0]['@graph'][0]['photo'][1]['selection'][0]
    it('coordinates', () => {
      expect(s).to.have.property('x', 10)
      expect(s).to.have.property('y', 20)
      expect(s).to.have.property('width', 30)
      expect(s).to.have.property('height', 40)
    })
    it('note', () => {
      const note = s.note[0]
      expect(note['text']).to.eql('selection note')
      expect(note['doc']).to.be.undefined
    })
  })

  describe('item has', () => {
    it('list', async () => {
      const data = (await ld)[0]['@graph']
      expect(data[0]).to.not.have.property('list')
      expect(data[1]['list']).to.eql('list1')
    })

    it('tag', async () => {
      const data = (await ld)[0]['@graph']
      expect(data[0]).to.not.have.property('tag')
      expect(data[1]['tag']).to.eql('mytag')
    })
  })
})
