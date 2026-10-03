import { Cursor, indexOf, range, seek } from '#tropy/common/sequence.js'

describe('sequence', () => {
  describe('indexOf', () => {
    it('does not match missing ids', () => {
      expect(indexOf(['a', 'b'], undefined)).to.equal(-1)
      expect(indexOf(['a', 'b'], null)).to.equal(-1)
    })
  })

  describe('range', () => {
    let seq = ['a', 'b', 'c', 'd']

    it('returns elements in from-to order', () => {
      expect(range(seq, 'b', 'd')).to.eql(['b', 'c', 'd'])
      expect(range(seq, 'd', 'b')).to.eql(['d', 'c', 'b'])
      expect(range(seq, 'c', 'c')).to.eql(['c'])
    })

    it('defaults to the start and end of the sequence', () => {
      expect(range(seq, null, 'b')).to.eql(['a', 'b'])
      expect(range(seq, 'x', 'b')).to.eql(['a', 'b'])
      expect(range(seq, 'c', null)).to.eql(['c', 'd'])
    })
  })

  describe('seek', () => {
    let list = ['a', 'b', 'c', 'd', 'e']

    it('returns null for empty sequences', () => {
      expect(seek([], null, 'next')).to.be.null
    })

    it('starts at the edges without a cursor in the sequence', () => {
      expect(seek(list, null, 'next')).to.equal('a')
      expect(seek(list, null, 'down')).to.equal('a')
      expect(seek(list, null, 'prev')).to.equal('e')
      expect(seek(list, null, 'up')).to.equal('e')
      expect(seek(list, 'x', 'next')).to.equal('a')
    })

    it('returns elements of item sequences', () => {
      let items = [{ id: 1 }, { id: 2 }]
      expect(seek(items, 1, 'next')).to.equal(items[1])
      expect(seek(items, items[1], 'prev')).to.equal(items[0])
    })

    describe('in a list', () => {
      it('moves to the next and previous element', () => {
        expect(seek(list, 'c', 'next')).to.equal('d')
        expect(seek(list, 'c', 'down')).to.equal('d')
        expect(seek(list, 'c', 'prev')).to.equal('b')
        expect(seek(list, 'c', 'up')).to.equal('b')
      })

      it('restricts moves at the edges', () => {
        expect(seek(list, 'e', 'next')).to.equal('e')
        expect(seek(list, 'a', 'up')).to.equal('a')
        expect(seek(list, 'e', 'down', { restrict: 'wrap' })).to.equal('a')
        expect(seek(list, 'a', 'prev', { restrict: 'wrap' })).to.equal('e')
        expect(seek(list, 'e', 'next', { restrict: 'none' })).to.be.null
      })

      it('moves to the first and last element', () => {
        expect(seek(list, 'c', 'first')).to.equal('a')
        expect(seek(list, 'c', 'last')).to.equal('e')
      })

      it('moves by pages', () => {
        expect(seek(list, 'b', 'pageDown', { pageSize: 2 })).to.equal('d')
        expect(seek(list, 'd', 'pageDown', { pageSize: 2 })).to.equal('e')
        expect(seek(list, 'd', 'pageUp', { pageSize: 2 })).to.equal('b')
        expect(seek(list, 'b', 'pageUp', { pageSize: 2 })).to.equal('a')
      })
    })

    describe('in a grid', () => {
      // a b c
      // d e f
      // g h
      let grid = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      let layout = { columns: 3 }

      it('moves by rows', () => {
        expect(seek(grid, 'e', 'up', layout)).to.equal('b')
        expect(seek(grid, 'b', 'down', layout)).to.equal('e')
      })

      it('stays put in the first and last row', () => {
        expect(seek(grid, 'b', 'up', layout)).to.equal('b')
        expect(seek(grid, 'h', 'down', layout)).to.equal('h')
      })

      it('moves down to the last element above a partial row', () => {
        expect(seek(grid, 'f', 'down', layout)).to.equal('h')
      })

      it('moves within rows', () => {
        expect(seek(grid, 'c', 'next', layout)).to.equal('d')
        expect(seek(grid, 'd', 'prev', layout)).to.equal('c')
        expect(seek(grid, 'e', 'start', layout)).to.equal('d')
        expect(seek(grid, 'e', 'end', layout)).to.equal('f')
        expect(seek(grid, 'g', 'end', layout)).to.equal('h')
      })
    })

    it('fails on unknown commands', () => {
      expect(() => seek(list, 'a', 'sideways')).to.throw()
      expect(() => seek(list, null, 'sideways')).to.throw()
    })
  })

  describe('Cursor', () => {
    let grid = ['a', 'b', 'c', 'd', 'e']

    it('returns the index of the element', () => {
      expect(new Cursor(grid, 'b').index).to.equal(1)
      expect(new Cursor(grid, 'x').index).to.equal(-1)
      expect(new Cursor(grid, null).index).to.equal(-1)
    })

    it('returns the current element', () => {
      expect(new Cursor(grid, 'b').current()).to.equal('b')
      expect(new Cursor(grid, 'x').current()).to.be.null
      expect(new Cursor(grid, null).current()).to.be.null
    })

    it('returns the adjacent elements', () => {
      expect(new Cursor(grid, 'c').adjacent()).to.eql(['b', 'd'])
      expect(new Cursor(grid, 'a').adjacent()).to.eql([null, 'b'])
      expect(new Cursor(grid, 'e').adjacent()).to.eql(['d', null])
      expect(new Cursor(grid, 'x').adjacent()).to.eql([null, null])
    })

    it('seeks with the bound options', () => {
      let cursor = new Cursor(grid, 'e', { columns: 3 })
      expect(cursor.up()).to.equal('b')
      expect(cursor.next()).to.equal('e')
      expect(cursor.seek('next', { restrict: 'none' })).to.be.null
    })
  })
})
