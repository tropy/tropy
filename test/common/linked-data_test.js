'use strict'

describe('linked-data helpers', () => {
  const ld = __require('common/linked-data')

  const { shortenLabel, propertyLabel } = ld

  it('parse propertyLabel arguments', () => {
    expect(propertyLabel('x')).to.be.undefined
    expect(propertyLabel('x', {})).to.be.undefined
    expect(propertyLabel('x', { x: {} })).to.be.undefined
    expect(propertyLabel('x', { x: { label: '' } })).to.equal('')
  })

  it('extract label from props', () => {
    expect(propertyLabel('uri', { uri: { label: 'Props Label' } }))
      .to.equal('Props Label')
  })

  it('extract label from template', () => {
    expect(propertyLabel(
      'uri', {}, { fields: [{ property: 'uri', label: 'My Label' }] }))
      .to.equal('My Label')
  })

  it('shortenlabel', () => {
    expect(shortenLabel('Oneword')).to.equal('oneword')
    expect(shortenLabel('Two Words')).to.equal('twoWords')
    expect(shortenLabel('Now Three Words')).to.equal('nowThreeWords')
    expect(shortenLabel(' Untrimmed ')).to.equal('untrimmed')
    expect(shortenLabel('CaSe FiXes')).to.equal('caseFixes')
    expect(shortenLabel('f\xf6reign ch\xe4rs')).to.equal('foreignChars')
    expect(shortenLabel('special _@й symbols!')).to.equal('specialSymbols')
  })
})

describe('groupedByTemplate', async () => {
  const { groupedByTemplate } = __require('common/linked-data')

  const template = {
    id: 'https://tropy.org/v1/tropy#test-template',
    fields: [{
      property: 'http://example.com/property',
      datatype: 'http://example.com/property#datatype',
      label: 'My Label'
    }]
  }

  const items = [
    { id: 1, template: 'https://tropy.org/v1/tropy#test-template' }
  ]

  const metadata = {
    1: { 'http://example.com/property': { text: 'value' } }
  }

  const resources = [
    { template, items, metadata }
  ]

  const ld = groupedByTemplate(resources)
  const data = (await ld)[0]

  it('metadata', () => {
    expect(data.items).to.eql([{ myLabel: 'value' }])
  })

  it('context', () => {
    expect(data['@context']).to.have.property('@vocab')
    expect(data['@context']).to.have.property('template')

    expect(data['@context']['items']['@context']).to.eql({
      myLabel: {
        '@id': 'http://example.com/property',
        '@type': 'http://example.com/property#datatype'
      }
    })
  })

  it('template', () => {
    expect(data).to.have.property('template', 'https://tropy.org/v1/tropy#test-template')
  })
})
