import reducer, {
  dismiss,
  restore,
  selectCompletedActivities,
  selectLastCompleted
} from '#tropy/slices/completed.js'
import { done } from '#tropy/slices/cmd.js'

describe('completed', () => {
  const run = (type, meta = {}, result) => {
    let action = { type, meta: { seq: 1, now: 100, agent: meta.agent } }
    let d = done(action, result, { maxAge: 1000, ...meta })
    d.meta.now = meta.now ?? 200
    return d
  }

  const reduce = (...actions) =>
    actions.reduce(reducer, undefined)

  it('records the last completed run per type', () => {
    let state = reduce(
      run('item.import', { refs: [1], sticky: true }),
      run('item.import', { now: 300, refs: [2, 3], agent: 'A' }),
      run('photo.consolidate', { errors: 2 }, new Error()))

    expect(state).to.eql({
      'item.import': {
        type: 'item.import', init: 100, done: 300, expires: 1300,
        agent: 'A', refs: [2, 3]
      },
      'photo.consolidate': {
        type: 'photo.consolidate', init: 100, done: 200, expires: 1200,
        failed: true, errors: 2
      }
    })
  })

  it('does not record cancelled runs', () => {
    let state = reduce(run('a'), run('a', { now: 300, cancelled: true }))
    expect(state.a.done).to.equal(200)
  })

  it('dismisses a type', () => {
    let state = reduce(run('a'), run('b'))
    expect(Object.keys(reducer(state, dismiss('a')))).to.eql(['b'])
  })

  it('drops expired records on restore', () => {
    let state = reduce(run('a', { now: 200 }), run('b', { now: 900 }))
    let action = { ...restore(state), meta: { now: 1500 } }
    expect(Object.keys(reducer({}, action))).to.eql(['b'])
  })

  it('selects live records', () => {
    let completed = reduce(
      run('a', { now: 100, sticky: true }),
      run('b', { now: 500, sticky: true }),
      run('c', { now: 600 }))

    expect(selectCompletedActivities({ completed }, 1050)
      .map(rec => rec.type)).to.eql(['b', 'a'])
    expect(selectCompletedActivities({ completed }, 1150)
      .map(rec => rec.type)).to.eql(['b'])

    expect(selectLastCompleted({ completed }, 1550).type).to.equal('c')
    expect(selectLastCompleted({ completed }, 1650)).to.be.null
  })
})
