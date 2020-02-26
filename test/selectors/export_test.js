'use strict'

describe('Export Selectors', () => {
  const selectors = __require('selectors/export')
  const { version } = __require('common/release')

  describe('getExportItemIds', () => {
    const { getExportItemIds } = selectors

    it('selects passed-in ids only', () => {
      expect(getExportItemIds({}, { id: [42] })).to.eql([42])
    })

    describe('when there are items selected', () => {
      it('selects selected items when no id given', () => {
        expect(
          getExportItemIds({ nav: { items: [23] } })
        ).to.eql([23])
      })
    })

    describe('when there are no items selected', () => {
      it('selects all visible items when no id given', () => {
        expect(
          getExportItemIds({
            nav: { items: [] },
            qr: { items: [7] }
          })
        ).to.eql([7])
      })
    })
  })

  describe('getExportItems', () => {
    const { getExportItems } = selectors

    const state = {
      items: F.items,
      metadata: F.metadata
    }

    it('includes @context', () => {
      expect(getExportItems(state, { id: [1] }))
        .to.have.property('@context')
        .and.to.have.property('@version', 1.1)
    })

    it('includes @graph', () => {
      expect(getExportItems(state, { id: [1] }))
        .to.have.property('@graph')
        .and.to.have.length(1)
    })

    it('includes version', () => {
      expect(getExportItems(state, { id: [1] }))
        .to.have.property('version', version)
    })
  })
})
