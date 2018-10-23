'use strict'

describe('List Selectors', () => {
  const selectors = __require('selectors/lists')

  const lists = {
    0: { id: 0, name: 'ROOT', children: [2, 5] },
    2: { id: 2, name: 'Italia', children: [4, 9] },
    1: { id: 1, name: 'Milano', children: [] },
    3: { id: 3, name: 'Roma', children: [] },
    4: { id: 4, name: 'Nord', children: [7, 1] },
    9: { id: 9, name: 'Sud', children: [3, 8, 6] },
    8: { id: 8, name: 'Napoli', children: [] },
    7: { id: 7, name: 'Venezia', children: [] },
    6: { id: 6, name: 'Palermo', children: [] },
    5: { id: 5, name: 'Francia', children: [] }
  }

  const expand = {
    0: true,
    2: true,
    9: true
  }

  describe('getListSubTree', () => {
    const { getListSubTree } = selectors

    it('returns expanded subtree', () => {
      expect(getListSubTree({ lists, sidebar: { expand } }, { root: 0 }))
        .to.eql([2, 4, 9, 3, 8, 6, 5])

      expect(getListSubTree({ lists, sidebar: { expand } }, { root: 2 }))
        .to.eql([4, 9, 3, 8, 6])
    })
  })
})
