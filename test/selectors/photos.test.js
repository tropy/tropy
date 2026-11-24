import { getVisiblePhotos } from '#tropy/selectors/index.js'
import { create } from '#tropy/common/selection.js'

describe('Photo Selectors', () => {
  describe('getVisiblePhotos', () => {
    it('keeps the order of the results when the item cursor moves', () => {
      let state = (cursor) => ({
        nav: { select: { item: create([1, 2, 3], { anchor: cursor }) } },
        qr: { items: [2, 1] },
        items: {
          1: { id: 1, photos: [11] },
          2: { id: 2, photos: [12] },
          3: { id: 3, photos: [13] }
        },
        photos: { 11: { id: 11 }, 12: { id: 12 }, 13: { id: 13 } }
      })

      // Item 3 is not among the results (yet): last.
      for (let cursor of [1, 2, 3])
        expect(getVisiblePhotos(state(cursor)).map(p => p.id))
          .to.eql([12, 11, 13])
    })
  })
})
