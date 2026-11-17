import reducer, {
  dismiss,
  restore,
  selectCompletedActivities,
  selectLastCompleted
} from '#tropy/slices/completed.js'
import { done } from '#tropy/slices/cmd.js'

describe('completed', () => {
  const DAY = 24 * 60 * 60 * 1000

  const run = (type, meta = {}, result) => {
    let action = {
      type,
      meta: {
        seq: 1,
        now: 100,
        agent: meta.agent,
        hidden: meta.hidden,
        history: meta.history
      }
    }
    let d = done(action, result, meta)
    d.meta.now = meta.now ?? 200
    return d
  }

  const reduce = (...actions) =>
    actions.reduce(reducer, undefined)

  it('records the last completed run per type', () => {
    let state = reduce(
      run('item.import', { items: [1] }),
      run('item.import', { now: 300, items: [2, 3], agent: 'A' }),
      run('photo.consolidate', { history: 'add' }, new Error()))

    expect(state).to.eql({
      'item.import': {
        type: 'item.import', done: 300, expires: 300 + DAY,
        agent: 'A', items: [2, 3]
      },
      'photo.consolidate': {
        type: 'photo.consolidate', done: 200, expires: 200 + DAY,
        errors: 1
      }
    })
  })

  it('does not record cancelled runs', () => {
    let state = reduce(
      run('a', { history: 'add' }),
      run('a', { now: 300, history: 'add', cancelled: true }))
    expect(state.a.done).to.equal(200)
  })

  it('records only runs with items, by an agent, or edits', () => {
    let state = reduce(
      run('a'),
      run('b', { items: [] }),
      run('c', { agent: 'A' }),
      run('d', { history: 'add' }),
      run('e', { agent: 'A', hidden: true }))
    expect(Object.keys(state)).to.eql(['b', 'c', 'd'])
  })

  it('dismisses a type', () => {
    let state = reduce(run('a', { items: [] }), run('b', { items: [] }))
    expect(Object.keys(reducer(state, dismiss('a')))).to.eql(['b'])
  })

  it('drops expired records on restore', () => {
    let state = reduce(
      run('a', { now: 200, items: [] }),
      run('b', { now: 900, items: [] }))
    let action = { ...restore(state), meta: { now: 500 + DAY } }
    expect(Object.keys(reducer({}, action))).to.eql(['b'])
  })

  it('selects live records', () => {
    let completed = reduce(
      run('a', { now: 100, items: [1] }),
      run('b', { now: 500, items: [] }),
      run('c', { now: 600, agent: 'A' }))

    expect(selectCompletedActivities({ completed }, 50 + DAY)
      .map(rec => rec.type)).to.eql(['b', 'a'])
    expect(selectCompletedActivities({ completed }, 150 + DAY)
      .map(rec => rec.type)).to.eql(['b'])

    // The record shown stays, also if expired.
    let nav = { view: { name: 'activity', type: 'a' } }
    expect(selectCompletedActivities({ completed, nav }, 150 + DAY)
      .map(rec => rec.type)).to.eql(['b', 'a'])

    expect(selectLastCompleted({ completed }, 550 + DAY).type).to.equal('c')
    expect(selectLastCompleted({ completed }, 650 + DAY)).to.be.null
  })
})
