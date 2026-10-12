import { getSelectedItems } from '#tropy/selectors/index.js'
import { create } from '#tropy/common/selection.js'

describe('Item Selectors', () => {
  describe('getSelectedItems', () => {
    it('returns all selected items, visible or not, primary first', () => {
      let items = { 1: { id: 1 }, 2: { id: 2 }, 4: { id: 4 } }
      let state = { items, nav: { item: create([4, 1]) }, qr: { items: [1, 2] } }

      // The cursor (4) is not visible: the first visible one is primary.
      expect(getSelectedItems(state).map(it => it.id)).to.eql([1, 4])
    })
  })
})
