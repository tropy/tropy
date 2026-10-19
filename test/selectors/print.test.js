import { create } from '#tropy/common/selection.js'
import { getPrintableItems } from '#tropy/selectors/index.js'

describe('Print Selectors', () => {
  describe('getPrintableItems', () => {
    let state = {
      nav: { item: create() },
      qr: { items: [1] },
      items: { 1: { id: 1, photos: [2], tags: [] } },
      photos: {
        2: { id: 2, notes: [], selections: [3], transcriptions: [10, 11] }
      },
      selections: { 3: { id: 3, notes: [], transcriptions: [12] } },
      transcriptions: {
        10: { id: 10, text: 'Old', modified: 'a' },
        11: { id: 11, text: 'New', modified: 'b' },
        12: { id: 12, text: '', modified: 'a' }
      },
      metadata: {},
      notes: {},
      notepad: {},
      tags: {},
      ontology: { props: {}, template: {} }
    }

    it('includes the active photo and selection transcriptions', () => {
      expect(getPrintableItems(state)[0].photos[0].transcriptions)
        .to.eql([{ id: 11, text: 'New' }])
    })
  })
})
