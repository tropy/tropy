'use strict'

const { text } = __require('value')

describe('selectors', () => {
  const selectors = __require('selectors/metadata')

  const metadata = {
    1: { id: 1, title: text('foo'), type: text('test') },
    2: { id: 2, title: text('bar'), type: text('test') }
  }

  const state = (items = []) => ({ nav: { items }, metadata })

  describe('getSelectedMetadata', () => {
    const { getSelectedMetadata } = selectors

    it('returns combined metadata in bulk', () => {
      expect(getSelectedMetadata(state([1, 2])))
        .to.have.property('data')
          .and.have.deep.property('title.text', 'foo')

      expect(getSelectedMetadata(state([])))
        .to.have.property('data').and.be.empty

      expect(getSelectedMetadata(state([23])))
        .to.have.property('data').and.be.empty
    })

    it('collects stats', () => {
      expect(getSelectedMetadata(state([1, 2])))
        .to.have.property('stats')
          .and.eql({ title: 1, type: 2 })
    })
  })

})
