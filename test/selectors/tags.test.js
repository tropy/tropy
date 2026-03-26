import { getItemTags } from '#tropy/selectors/index.js'

describe('Tag Selectors', () => {
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
    const getState = (ids) => ({ tags, items, nav: { items: ids } })

    it('returns empty for no selection', () => {
      expect(getItemTags(getState([]))).to.eql([])
    })

    it('returns empty for items with no tags', () => {
      expect(getItemTags(getState([1]))).to.eql([])
    })

    it('returns tags for a single item', () => {
      expect(getItemTags(getState([2]))).to.have.length(1)
      expect(getItemTags(getState([3]))).to.have.length(2)
    })

    it('returns union of tags across items', () => {
      expect(getItemTags(getState([2, 3]))).to.have.length(2)
    })

    it('collects tag counts across items', () => {
      expect(getItemTags(getState([2, 3])).map(t => t.count))
        .to.eql([1, 2])
    })
  })
})
