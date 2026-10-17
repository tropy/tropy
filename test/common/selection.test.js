import {
  all,
  clear,
  create,
  elements,
  equal,
  growingEdge,
  has,
  ids as getIds,
  primary,
  select,
  Selection,
  size
} from '#tropy/common/selection.js'

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

  it('lists selected ids as numbers', () => {
    let state = create([3, 1])
    expect(size(state)).to.equal(2)
    expect(getIds(state).sort()).to.eql([1, 3])
  })

  it('does not count inherited properties as selected', () => {
    expect(has(create(), 'constructor')).to.be.false
  })

  it('finds the primary element: the cursor, if selected', () => {
    expect(primary(run([[2], [5, 'extend']]), seq)).to.equal(5)
    expect(primary(run([[2], [4, 'toggle']]), seq)).to.equal(4)
  })

  it('falls back to the first selected element as primary', () => {
    expect(primary(run([[2], [4, 'toggle'], [4, 'toggle']]), seq)).to.equal(2)
    expect(primary(run([[2], [5, 'extend']]), [1, 2, 3])).to.equal(2)
    expect(primary(create(), seq)).to.be.null
  })

  it('compares states by ids, anchor and cursor', () => {
    expect(equal(create([1, 2]), create([1, 2]))).to.be.true
    expect(equal(create([1, 2]), create([2, 1]))).to.be.false
    expect(equal(create([1, 2]), create([1, 3, 2]))).to.be.false
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
})

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

describe('Selection', () => {
  let seq = [3, 1, 2]
  let selection = new Selection(create([2, 3]), seq)

  it('reads the selection in sequence order', () => {
    expect(selection.elements()).to.eql([3, 2])
    expect(selection.size).to.equal(2)
    expect(selection.has(1)).to.be.false
    expect(selection.primary()).to.equal(3)
  })

  it('lists the primary id first, also for sequences of items', () => {
    let items = seq.map(id => ({ id }))
    expect(new Selection(create([2, 3]), items).ids()).to.eql([3, 2])
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
