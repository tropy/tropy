'use strict'

describe('Reducer Helpers', () => {

  describe('nested', () => {
    const { nested } = __require('reducers/util')

    describe('add', () => {
      const state = {
        1: { id: 1, tags: [] },
        2: { id: 2, tags: [] }
      }

      it('supports single id calls', () => {
        let s1 = nested.add('tags', state, { id: 1, tags: [1] })
        let s2 = nested.add('tags', s1, { id: 1, tags: [2] })
        let s3 = nested.add('tags', s2, { id: 1, tags: [3, 4] })

        expect(s1).to.have.nested.property('1.tags').eql([1])
        expect(s2).to.have.nested.property('1.tags').eql([1, 2])
        expect(s3).to.have.nested.property('1.tags').eql([1, 2, 3, 4])
      })

      it('supports multiple id calls', () => {
        let s1 = nested.add('tags', state, { id: [1, 2], tags: [1] })
        let s2 = nested.add('tags', s1, { id: [1, 2], tags: [2] })
        let s3 = nested.add('tags', s2, { id: [1, 2], tags: [3, 4] })

        expect(s1).to.have.nested.property('1.tags').eql([1])
        expect(s2).to.have.nested.property('1.tags').eql([1, 2])
        expect(s3).to.have.nested.property('1.tags').eql([1, 2, 3, 4])
        expect(s1).to.have.nested.property('2.tags').eql([1])
        expect(s2).to.have.nested.property('2.tags').eql([1, 2])
        expect(s3).to.have.nested.property('2.tags').eql([1, 2, 3, 4])
      })

      it('supports meta.idx', () => {
        let s1 = nested.add('tags', state, { id: 1, tags: [1, 2, 3] })
        let s2 = nested.add('tags', s1, { id: 1, tags: [4, 5] }, { idx: 1 })

        expect(s1).to.have.nested.property('1.tags').eql([1, 2, 3])
        expect(s2).to.have.nested.property('1.tags').eql([1, 4, 5, 2, 3])
      })
    })

    describe('remove', () => {
      const state = {
        1: { id: 1, tags: [2] },
        2: { id: 2, tags: [1, 2, 3] }
      }

      it('supports single id calls', () => {
        let s1 = nested.remove('tags', state, { id: 2, tags: [2] })
        let s2 = nested.remove('tags', s1, { id: 2, tags: [1, 3] })

        expect(s1).to.have.nested.property('2.tags').eql([1, 3])
        expect(s2).to.have.nested.property('2.tags').eql([])
      })

      it('supports multiple id calls', () => {
        let s1 = nested.remove('tags', state, { id: [1, 2], tags: [1, 2] })

        expect(s1).to.have.nested.property('1.tags').eql([])
        expect(s1).to.have.nested.property('2.tags').eql([3])
      })
    })
  })
})
