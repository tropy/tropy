'use strict'

const { text } = __require('value')

describe('Metadata Selectors', () => {
  const selectors = __require('selectors/metadata')

  const metadata = {
    1: { id: 1, title: text('foo'), type: text('test') },
    2: { id: 2, title: text('bar'), type: text('test') }
  }

  const state = (items = []) => ({ nav: { items }, metadata })

  describe('getItemMetadata', () => {
    const { getItemMetadata } = selectors

    it('returns combined metadata in bulk', () => {
      expect(getItemMetadata(state([1, 2])))
        .to.have.nested.property('title.text', 'foo')

      expect(getItemMetadata(state([])))
        .to.eql({ id: [] })

      expect(getItemMetadata(state([23])))
        .to.eql({ id: [23] })
    })

    it('collects stats', () => {
      expect(getItemMetadata(state([1, 2])))
        .to.have.nested.property('title.mixed', true)
      expect(getItemMetadata(state([1, 2])))
        .to.have.nested.property('type.mixed', false)
    })
  })

})
