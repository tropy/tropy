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
