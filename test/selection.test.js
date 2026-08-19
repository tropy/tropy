import { growingEdge } from '#tropy/selection.js'

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
})
