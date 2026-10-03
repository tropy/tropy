import { getSelectionChange, growingEdge } from '#tropy/common/selection.js'

describe('selection', () => {
  describe('growingEdge', () => {
    it('grows at the tail without a previous range', () => {
      expect(growingEdge([3, 5])).to.equal(1)
      expect(growingEdge([3, 5], [])).to.equal(1)
    })

    it('does not grow without a range', () => {
      expect(growingEdge()).to.equal(0)
      expect(growingEdge([])).to.equal(0)
      expect(growingEdge([], [3, 5])).to.equal(0)
    })

    it('grows at the head', () => {
      expect(growingEdge([1, 5], [3, 5])).to.equal(-1)
    })

    it('grows at the tail', () => {
      expect(growingEdge([3, 7], [3, 5])).to.equal(1)
    })

    it('cancels out if both edges grew, as in select all', () => {
      expect(growingEdge([1, 7], [3, 5])).to.equal(0)
    })

    it('does not grow when unchanged or shrinking', () => {
      expect(growingEdge([3, 5], [3, 5])).to.equal(0)
      expect(growingEdge([4, 4], [3, 5])).to.equal(0)
    })
  })

  describe('getSelectionChange', () => {
    let seq = [1, 2, 3, 4]

    it('replaces the selection', () => {
      expect(getSelectionChange([1], seq, 2)).to.eql([[2], 'replace'])
      expect(getSelectionChange([1, 2], seq, 2)).to.eql([[2], 'replace'])
    })

    it('does nothing if the id is the only selected one', () => {
      expect(getSelectionChange([2], seq, 2)).to.be.null
    })

    it('does nothing if the id is not in the sequence', () => {
      expect(getSelectionChange([1], seq, 9)).to.be.null
    })

    it('returns elements of the sequence', () => {
      let items = [{ id: 1 }, { id: 2 }]
      expect(getSelectionChange([1], items, 2, { isRange: true }))
        .to.eql([[items[0], items[1]], 'merge'])
    })

    it('toggles ids with meta', () => {
      expect(getSelectionChange([1], seq, 2, { isMeta: true }))
        .to.eql([[2], 'append'])
      expect(getSelectionChange([1, 2], seq, 2, { isMeta: true }))
        .to.eql([[2], 'remove'])
    })

    it('merges ranges from the head', () => {
      expect(getSelectionChange([1], seq, 3, { isRange: true }))
        .to.eql([[1, 2, 3], 'merge'])
      expect(getSelectionChange([4], seq, 2, { isRange: true }))
        .to.eql([[4, 3, 2], 'merge'])
    })

    it('merges ranges from the start without a selection', () => {
      expect(getSelectionChange([], seq, 2, { isRange: true }))
        .to.eql([[1, 2], 'merge'])
    })

    it('replaces the selection if the head is not in the sequence', () => {
      expect(getSelectionChange([9], seq, 2, { isRange: true }))
        .to.eql([[2], 'replace'])
    })

    it('subtracts selected ranges, keeping the id as head', () => {
      expect(getSelectionChange([1, 2, 3], seq, 1, { isRange: true }))
        .to.eql([[1, 3, 2], 'subtract'])
    })
  })
})
