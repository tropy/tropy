import {
  all,
  clear,
  create,
  elements,
  focus,
  growingEdge,
  has,
  ids as getIds,
  head,
  remove,
  select,
  Selection,
  size
} from '#tropy/common/selection.js'
import { createSequence } from '#tropy/common/sequence.js'

describe('selection state', () => {
  let seq = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  let none = { selected: {}, base: {}, anchor: null, cursor: null }

  // Applies gestures [id, mode] and returns the selected ids.
  let run = (gestures, state = none, s = seq) => {
    for (let [id, mode] of gestures)
      state = select(state, s, id, { mode })
    return state
  }

  let ids = (state, s = seq) => elements(state, s)

  it('replaces the selection', () => {
    expect(ids(run([[2], [4]]))).to.eql([4])
  })

  it('toggles single elements', () => {
    expect(ids(run([[2], [4, 'toggle']]))).to.eql([2, 4])
    expect(ids(run([[2], [4, 'toggle'], [2, 'toggle']]))).to.eql([4])
  })

  it('extends ranges from the anchor, shrinking them when moving back', () => {
    expect(ids(run([[2], [5, 'extend']]))).to.eql([2, 3, 4, 5])
    expect(ids(run([[2], [5, 'extend'], [3, 'extend']]))).to.eql([2, 3])
    expect(ids(run([[4], [2, 'extend']]))).to.eql([2, 3, 4])
  })

  it('replaces the previous range, keeping the rest (as in Finder)', () => {
    expect(ids(run([[2], [4, 'toggle'], [6, 'extend']]))).to.eql([2, 4, 5, 6])
    expect(ids(run([[5], [8, 'toggle'], [3, 'extend']]))).to.eql([3, 4, 5, 6, 7, 8])
    expect(ids(run([[5], [8, 'toggle'], [3, 'extend'], [10, 'extend']])))
      .to.eql([8, 9, 10])
  })

  it('adds flipped ranges after a click', () => {
    expect(ids(run([[2], [4, 'flip']]))).to.eql([2, 3, 4])
    expect(ids(run([[1], [4, 'toggle'], [5, 'flip']]))).to.eql([1, 4, 5])
  })

  it('flips ranges, cutting away from the selection', () => {
    let state = run([[1], [5, 'extend'], [2, 'toggle'], [4, 'flip']])
    expect(ids(state)).to.eql([1, 5])
    expect(ids(run([[3, 'flip']], state))).to.eql([1, 4, 5])
  })

  it('keeps the anchor and cursor on a deselecting toggle', () => {
    let state = run([[2], [3, 'toggle'], [3, 'toggle']])
    expect(state).to.include({ anchor: 3, cursor: 3 })
    expect(ids(run([[5, 'extend']], state))).to.eql([2, 3, 4, 5])
  })

  it('starts ranges at the element without a visible anchor', () => {
    expect(ids(run([[4, 'extend']]))).to.eql([4])
    expect(ids(run([[4, 'extend']], run([[1]]), [2, 3, 4]), [2, 3, 4]))
      .to.eql([4])
  })

  it('keeps the selected elements when the sequence is re-sorted', () => {
    let state = run([[2], [4, 'extend']])
    expect(ids(state, [5, 4, 3, 2, 1])).to.eql([4, 3, 2])
  })

  it('focuses an element, keeping a selection that contains it', () => {
    let state = create([2, 4], { anchor: 2, cursor: 4 })

    let focused = focus(state, 2)

    expect(getIds(focused)).to.have.members([2, 4])
    expect(focused).to.include({ anchor: 2, cursor: 2 })
    expect(focus(focused, 2)).to.equal(focused)
    expect(focus(state, 6)).to.eql(create([6]))
  })

  it('focuses nothing, selecting nothing', () => {
    let empty = create()

    expect(focus(create([2, 4]), null)).to.eql(empty)
    expect(focus(empty, null)).to.equal(empty)
  })

  it('removes elements, dropping a removed anchor or cursor', () => {
    let state = create([2, 4, 6], { anchor: 2, cursor: 6 })

    expect(getIds(remove(state, [6, 8]))).to.have.members([2, 4])
    expect(remove(state, [6])).to.include({ anchor: 2, cursor: null })
    expect(remove(state, [8])).to.equal(state)
  })

  it('lists selected ids as numbers', () => {
    let state = create([3, 1])
    expect(size(state)).to.equal(2)
    expect(getIds(state).sort()).to.eql([1, 3])
  })

  it('does not count inherited properties as selected', () => {
    expect(has(create(), 'constructor')).to.be.false
  })

  it('finds the head: the cursor, if selected', () => {
    expect(head(run([[2], [5, 'extend']]))).to.equal(5)
    expect(head(run([[2], [4, 'toggle']]))).to.equal(4)
  })

  it('falls back to the first selected id as head', () => {
    expect(head(run([[3], [2, 'toggle'], [2, 'toggle']]))).to.equal(3)
    expect(head({ ...create([4, 2]), cursor: 9 })).to.equal(2)
    expect(head(create())).to.be.null
  })

  // Grid with 4 columns: A = 5, B = 6, X = 2 (above B).
  it('steps from the cursor, as in Finder', () => {
    let state = run([[5], [6, 'step']])
    expect(ids(state)).to.eql([5, 6])

    state = run([[2, 'step']], state)
    expect(ids(state)).to.eql([2, 3, 4, 5, 6])

    expect(ids(run([[6, 'step']], state))).to.eql([6])
  })

  it('shrinks when stepping back', () => {
    expect(ids(run([[5], [6, 'step'], [5, 'step']]))).to.eql([5])
  })

  it('extends from the last step on Shift-click', () => {
    expect(ids(run([[5], [6, 'step'], [8, 'extend']]))).to.eql([5, 6, 7, 8])
  })

  it('returns the same state if nothing changes', () => {
    let state = run([[2]])
    expect(select(state, seq, 2)).to.equal(state)

    state = run([[4, 'extend']], state)
    expect(select(state, seq, 4, { mode: 'extend' })).to.equal(state)
    expect(select(state, seq, 4, { mode: 'flip' })).to.equal(state)
  })

  it('focuses selected elements, keeping the selection', () => {
    let state = run([[2], [4, 'extend']])
    let next = select(state, seq, 3, { mode: 'focus' })

    expect(ids(next)).to.eql([2, 3, 4])
    expect(next).to.include({ anchor: 3, cursor: 3 })
    expect(ids(select(state, seq, 6, { mode: 'focus' }))).to.eql([6])
  })

  it('ignores elements not in the sequence', () => {
    let state = run([[2]])
    expect(select(state, seq, 99)).to.equal(state)
  })

  it('returns the same state for selecting all or clearing again', () => {
    let state = all(run([[2]]), seq)
    expect(all(state, seq)).to.equal(state)

    state = clear(state)
    expect(clear(state)).to.equal(state)
  })

  it('selects all, keeping a cursor in the sequence, else from the first', () => {
    expect(all(run([[3], [5, 'extend']]), seq))
      .to.include({ anchor: 3, cursor: 5 })
    expect(all({ ...create([2]), cursor: 99 }, seq))
      .to.include({ anchor: 1, cursor: 1 })
    expect(all(create(), seq)).to.include({ anchor: 1, cursor: 1 })
  })

  it('selects all and clears', () => {
    let state = run([[2]])
    expect(ids(all(state, seq))).to.eql(seq)
    expect(ids(clear(state))).to.eql([])
    expect(ids(run([[null, 'clear']], state))).to.eql([])
  })

  it('works on sequences of items', () => {
    let items = seq.map(id => ({ id }))
    let state = run([[2], [4, 'extend']], none, items)
    expect(elements(state, items).map(it => it.id)).to.eql([2, 3, 4])
  })

  it('returns the selected elements in sequence order, few or many', () => {
    // A long sequence, not in id order; 999 is not in it.
    let long = Array.from({ length: 200 }, (_, i) => 200 - i)
    let items = long.map(id => ({ id }))

    for (let selected of [
      [7, 150, 999, 42],
      long.filter(id => id % 4 !== 0)
    ]) {
      let state = create(selected)
      let expected = long.filter(id => selected.includes(id))

      expect(elements(state, long)).to.eql(expected)
      expect(elements(state, createSequence(long.slice()))).to.eql(expected)
      expect(elements(state, items).map(it => it.id)).to.eql(expected)
    }
  })
})

describe('selection', () => {
  describe('growingEdge', () => {
    it('grows at the end without a previous range', () => {
      expect(growingEdge([3, 5])).to.equal(1)
      expect(growingEdge([3, 5], [])).to.equal(1)
    })

    it('does not grow without a range', () => {
      expect(growingEdge()).to.equal(0)
      expect(growingEdge([])).to.equal(0)
      expect(growingEdge([], [3, 5])).to.equal(0)
    })

    it('grows at the start', () => {
      expect(growingEdge([1, 5], [3, 5])).to.equal(-1)
    })

    it('grows at the end', () => {
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

describe('Selection', () => {
  let seq = [3, 1, 2]
  let selection = new Selection(create([2, 3]), seq)

  it('reads the selection in sequence order', () => {
    expect(selection.elements()).to.eql([3, 2])
    expect(selection.size).to.equal(2)
    expect(selection.has(1)).to.be.false
    expect(selection.head()).to.equal(3)
  })

  it('returns new states for changes', () => {
    // From the anchor 3, keeping 2 outside the range.
    let state = selection.select(1, { mode: 'extend' })
    expect(new Selection(state, seq).elements()).to.eql([3, 1, 2])
    expect(selection.select(3)).to.not.equal(selection.state)
  })
})

describe('Selection.from', () => {
  let seq = [{ id: 1 }, { id: 2 }]

  it('selects a single element or id', () => {
    for (let selection of [Selection.from(seq[1], seq), Selection.from(2, seq)]) {
      expect(selection.size).to.equal(1)
      expect(selection.has(2)).to.be.true
      expect(selection.cursor).to.equal(2)
    }

    expect(Selection.from(null, seq).size).to.equal(0)
  })

  it('wraps selection states', () => {
    let selection = Selection.from(create([1, 2]), seq)

    expect(selection.size).to.equal(2)
    expect(Selection.from(selection, seq)).to.equal(selection)
  })
})
