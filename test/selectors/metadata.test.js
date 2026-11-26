import { getItemMetadata } from '#tropy/selectors/index.js'
import { text } from '#tropy/value.js'
import { create } from '#tropy/common/selection.js'

describe('Metadata Selectors', () => {
  const metadata = {
    1: { id: 1, title: text('foo'), type: text('test') },
    2: { id: 2, title: text('bar'), type: text('test') }
  }

  const state = (items = []) =>
    ({ nav: { select: { item: create(items) } }, qr: { items }, metadata })

  describe('getItemMetadata', () => {
    it('returns empty for no selection', () => {
      expect(getItemMetadata(state([]))).to.eql({ id: [] })
    })

    it('returns ids only for missing items', () => {
      expect(getItemMetadata(state([23]))).to.eql({ id: [23] })
    })

    it('returns combined metadata, with the cursor item\'s values', () => {
      // The cursor is the last selected item.
      let result = getItemMetadata(state([1, 2]))
      expect(result.id).to.have.members([1, 2])
      expect(result).to.have.nested.property('title.text', 'bar')
    })

    it('marks mixed values', () => {
      expect(getItemMetadata(state([1, 2])))
        .to.have.nested.property('title.mixed', true)
    })

    it('marks uniform values', () => {
      expect(getItemMetadata(state([1, 2])))
        .to.have.nested.property('type.mixed', false)
    })
  })
})
