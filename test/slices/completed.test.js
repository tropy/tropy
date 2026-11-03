import reducer, { dismiss, restore } from '#tropy/slices/completed.js'
import { done } from '#tropy/slices/cmd.js'
import { getCompletedActivities } from '#tropy/selectors/index.js'

describe('completed', () => {
  const run = (type, meta = {}, result) => {
    let action = { type, meta: { seq: 1, now: 100 } }
    let d = done(action, result, { keep: 1000, ...meta })
    d.meta.now = meta.now ?? 200
    return d
  }

  const reduce = (...actions) =>
    actions.reduce(reducer, undefined)

  it('records done actions which are kept', () => {
    let state = reduce(
      run('item.import', { refs: [1, 2], agent: 'A' }),
      run('item.import', { keep: undefined }),
      run('photo.consolidate', {}, new Error()))

    expect(state).to.eql([
      { type: 'item.import', init: 100, done: 200, keep: 1000,
        agent: 'A', refs: [1, 2] },
      { type: 'photo.consolidate', init: 100, done: 200, keep: 1000,
        errors: 1 }
    ])
  })

  it('dismisses all runs of a type', () => {
    let state = reduce(run('a'), run('b'), run('a'))
    expect(reducer(state, dismiss('a')).map(r => r.type)).to.eql(['b'])
  })

  it('drops expired runs on restore', () => {
    let state = reduce(run('a', { now: 200 }), run('b', { now: 900 }))
    let action = { ...restore(state), meta: { now: 1500 } }
    expect(reducer([], action).map(r => r.type)).to.eql(['b'])
    expect(reducer(state, { ...restore({}), meta: { now: 0 } })).to.eql([])
  })

  it('aggregates live runs per type', () => {
    let completed = reduce(
      run('a', { now: 100, refs: [1] }),
      run('a', { now: 500, refs: [1, 2], errors: 2 }),
      run('a', { now: 600, cancelled: true }),
      run('b', { now: 400 }))

    let [a, b, ...rest] = getCompletedActivities({ completed }, 1200)

    expect(rest).to.be.empty
    expect(b).to.include({ type: 'b', count: 0 })
    expect(a).to.include({
      type: 'a', count: 2, errors: 2, cancelled: true, done: 600
    })

    expect(getCompletedActivities({ completed }, 1450)
      .map(x => x.type)).to.eql(['a'])
  })
})
