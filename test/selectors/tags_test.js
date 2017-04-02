'use strict'


describe('Tag Selectors', () => {
  const selectors = __require('selectors/tags')

  const tags = {
    1: { id: 1, name: 'Rosso', visible: true },
    2: { id: 2, name: 'Azurro', visible: true }
  }

  const items = {
    1: { id: 1, tags: [] },
    2: { id: 2, tags: [1] },
    3: { id: 3, tags: [1, 2] }
  }


  describe('getItemTags', () => {
    const { getItemTags } = selectors
    const getState = (ids) => ({ tags, items, nav: { items: ids } })

    it('returns combined tags', () => {
      expect(getItemTags(getState([]))).to.eql([])
      expect(getItemTags(getState([1]))).to.eql([])
      expect(getItemTags(getState([2]))).to.have.length(1)
      expect(getItemTags(getState([3]))).to.have.length(2)
      expect(getItemTags(getState([2, 3]))).to.have.length(2)
    })

    it('collects stats', () => {
      expect(getItemTags(getState([2, 3])).map(t => t.count)).to.eql([1, 2])
    })
  })
})
