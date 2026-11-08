import { TermCache, keyOf, membership } from '#tropy/common/matches.js'

describe('common/matches', () => {
  const lists = (subjects, notes = []) => ({
    subjects: Int32Array.from(subjects),
    notes: Int32Array.from(notes)
  })

  describe('TermCache', () => {
    it('keeps term lists until the next write', () => {
      let cache = new TermCache()
      cache.set('a', 1, lists([1]))

      expect(cache.get('a', 1).subjects).to.eql(Int32Array.of(1))
      expect(cache.get('a', 2)).to.be.null
      expect(cache.get('a', 1)).to.be.null
    })

    it('drops the least recently used lists beyond its size', () => {
      let cache = new TermCache(3)
      cache.set('a', 1, lists([1, 2]))
      cache.set('b', 1, lists([3]))
      cache.get('a', 1)
      cache.set('c', 1, lists([4]))

      expect(cache.get('b', 1)).to.be.null
      expect(cache.get('a', 1)).not.to.be.null
      expect(cache.size).to.equal(3)
    })

    it('keys terms by scope, prefix and text', () => {
      expect(keyOf({ scope: 'any', prefix: true, text: 'Box' }))
        .to.equal(keyOf({ scope: 'any', prefix: true, text: 'box' }))
      expect(keyOf({ scope: 'any', prefix: true, text: 'box' }))
        .not.to.equal(keyOf({ scope: 'any', prefix: false, text: 'box' }))
    })
  })

  describe('membership', () => {
    // Items 1, 2; photo 10 of item 1; note 7 of photo 10.
    let itemOf = Int32Array.from({ length: 11 }, (_, i) =>
      (i === 10) ? 1 : (i <= 2 ? i : 0))
    let subjects = { itemOf, subjectOfNote: (note) => (note === 7) ? 10 : 0 }

    it('keeps the view items matching every term, in view order', () => {
      expect(membership([2, 1], [lists([1, 2]), lists([10, 10])], subjects))
        .to.eql([1])
      expect(membership([2, 1], [lists([2]), lists([], [7])], subjects))
        .to.eql([])
      expect(membership([2, 1], [lists([2, 1]), lists([2], [7])], subjects))
        .to.eql([2, 1])
    })

    it('starts over with each call', () => {
      membership([1, 2], [lists([1, 2])], subjects)
      expect(membership([1, 2], [lists([3])], subjects)).to.eql([])
    })
  })
})
