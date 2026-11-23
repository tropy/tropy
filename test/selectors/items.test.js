import { getSelectedItems } from '#tropy/selectors/index.js'
import { create } from '#tropy/common/selection.js'

describe('Item Selectors', () => {
  describe('getSelectedItems', () => {
    it('returns all selected items, visible or not, primary first', () => {
      let items = { 1: { id: 1 }, 2: { id: 2 }, 4: { id: 4 } }
      let state = { items, nav: { selection: { item: create([1, 4]) } }, qr: { items: [1, 2] } }

      // The cursor (4) is primary, though not visible.
      expect(getSelectedItems(state).map(it => it.id)).to.eql([4, 1])
    })
  })
})
