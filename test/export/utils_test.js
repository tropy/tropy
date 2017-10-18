'use strict'

describe('linked-data helpers', () => {
  const { shortenLabel, propertyLabel } = __require('export/utils')

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

describe('newKey', () => {
  const { newKey } = __require('export/utils')
  it('no number', () => {
    expect(newKey('foo')).to.equal('foo2')
  })
  it('ends with a number', () => {
    expect(newKey('foo42')).to.equal('foo43')
  })
})

describe('newProperties', () => {
  const { newProperties } = __require('export/utils')
  // const { assign } = Object
  const { template, metadata, props } = require('./helpers')

  it('add values to empty destination', () => {
    expect(newProperties(metadata[1], {}, false, props, template)).to.eql({
      myLabel: 'value',
      nonTemplateProperty: 'custom'
    })
  })

  it('does not overwrite existing values', () => {
    const src = {
      myLabel: 'already here',
    }
    expect(newProperties(metadata[1], src, false, props, template)).to.eql({
      myLabel: 'already here',
      myLabel2: 'value',
      nonTemplateProperty: 'custom'
    })
  })

  it('does not add multiple @context entries for same thing', () => {
    const context = {
      myLabel: { '@id': 'http://example.com/property' }
    }
    expect(newProperties(metadata[1], context, true, props, template)).to.eql({
      myLabel: { '@id': 'http://example.com/property' },
      nonTemplateProperty: {
        '@id': 'http://example.com/custom-property',
        '@type': 'http://example.com/custom-property#type'
      }
    })
  })

})
