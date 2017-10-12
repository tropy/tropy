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


describe('itemToLD', () => {
  const { itemToLD } = __require('common/linked-data')

  const resources = {
    item_template: {
      id: 'https://tropy.org/v1/tropy#test-template',
      fields: [{
        property: 'http://example.com/property',
        datatype: 'http://example.com/property#datatype',
        label: 'My Label'
      }]
    },
    photos: [],
    metadata: { 'http://example.com/property': { text: 'value' } },
    props: {}
  }

  const ld = itemToLD(resources)

  it('metadata', () => {
    expect(ld).to.eventually.have.property('myLabel', 'value')
  })

  it('@context', () => {
    expect(ld).to.eventually.have.deep.property(
      '@context', {
        _template: {
          '@id': 'https://tropy.org/v1/tropy#Template',
          '@type': '@id'
        },
        myLabel: {
          '@id': 'http://example.com/property',
          '@type': 'http://example.com/property#datatype'
        }
      })
  })

  it('@type', () => {
    expect(ld).to.eventually.have.property('@type', 'https://tropy.org/v1/tropy#Item')
  })

  it('_template', () => {
    expect(ld).to.eventually.have.property('_template', 'https://tropy.org/v1/tropy#test-template')
  })
})
