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
