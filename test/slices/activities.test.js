import reducer, {
  cancel,
  dismiss,
  restore,
  resume,
  selectActivity,
  selectMostRecentActivity,
  selectPastActivities,
  start,
  stop,
  suspend,
  update
} from '#tropy/slices/activities.js'
import { done } from '#tropy/slices/cmd.js'

const reduce = (...actions) =>
  actions.reduce(reducer, undefined)

describe('activities', () => {
  const cmd = (type, meta) => ({
    type,
    meta: { cmd: 'project', seq: 1, now: 100, ...meta }
  })

  // Starts the activity of a command, as *exec does.
  const started = (action) => {
    let s = start(action)
    s.meta = { ...s.meta, now: action.meta.now }
    return s
  }

  const busy = (...actions) => reduce(...actions).busy

  it('starts activities for commands explicitly', () => {
    let action = cmd('item.import', { cancel: true })

    expect(busy(action)).to.eql({})
    expect(busy(action, started(action)))
      .to.eql({
        1: { id: 1, type: 'item.import', due: 500, cancel: true }
      })
  })

  it('updates activities', () => {
    let action = cmd('item.import')
    expect(busy(started(action), update(action, { progress: 1, total: 2 })))
      .to.have.nested.property('1.progress', 1)
    expect(busy(update(action, { progress: 1 }))).to.eql({})
  })

  it('postpones activities suspended before they are due', () => {
    let action = cmd('item.import')
    let at = (now, a) => ({ ...a, meta: { ...a.meta, now } })

    let state = reduce(started(action), at(200, suspend(action)))
    expect(state.busy).to.have.nested.property('1.suspended', 200)

    state = reducer(state, at(1000, resume(action)))
    expect(state.busy[1]).to.not.have.property('suspended')
    expect(state.busy[1]).to.have.property('due', 1300)
  })

  it('does not postpone activities suspended after they are due', () => {
    let action = cmd('item.import')
    let at = (now, a) => ({ ...a, meta: { ...a.meta, now } })

    expect(busy(
      started(action),
      at(600, suspend(action)),
      at(1000, resume(action)))).to.have.nested.property('1.due', 500)
  })

  it('removes activities when their command is done', () => {
    let action = cmd('item.import')
    expect(busy(started(action), done(action, {}))).to.eql({})
  })

  it('removes failed activities', () => {
    let action = cmd('item.import')
    expect(busy(started(action), done(action, new Error('failed'))))
      .to.eql({})
  })

  it('does not change activities on cancel', () => {
    let action = cmd('item.import')
    let state = reduce(started(action))
    expect(reducer(state, cancel(1))).to.equal(state)
  })

  it('matches done actions stopping activities', () => {
    let action = cmd('item.import')

    expect(stop.match(done(action))).to.be.true
    expect(stop.match(action)).to.be.false
  })

  it('records the items reported while busy', () => {
    let action = cmd('transcription.process')
    let state = reduce(
      started(action),
      update(action, { items: [1, 2] }),
      done(action))

    expect(state.busy).to.eql({})
    expect(state.past['transcription.process'])
      .to.include({ id: 1 })
      .and.to.have.property('items').eql([1, 2])
  })
})

describe('past activities', () => {
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

  const past = (...actions) => reduce(...actions).past

  it('records the last completed run per type', () => {
    expect(past(
      run('item.import', { items: [1] }),
      run('item.import', { now: 300, items: [2, 3], agent: 'A' }),
      run('photo.consolidate', { history: 'add' }, new Error())
    )).to.eql({
      'item.import': {
        type: 'item.import', id: 1, done: 300, expires: 300 + DAY,
        agent: 'A', items: [2, 3]
      },
      'photo.consolidate': {
        type: 'photo.consolidate', id: 1, done: 200, expires: 200 + DAY,
        errors: 1, history: 'add'
      }
    })
  })

  it('records cancelled activities only with items', () => {
    let state = past(
      run('a', { items: [1] }),
      run('a', { now: 300, items: [], cancelled: true }))
    expect(state.a).to.include({ done: 200 }).and.not.have.property('cancelled')

    state = past(run('a', { now: 300, items: [1], cancelled: true }))
    expect(state.a).to.include({ done: 300, cancelled: true })
  })

  it('records completed activities, unless hidden', () => {
    expect(Object.keys(past(
      run('a'),
      run('b', { hidden: true })
    ))).to.eql(['a'])
  })

  it('records single actions with history', () => {
    expect(Object.keys(past(
      { type: 'nav.search', meta: { now: 100, history: true } },
      { type: 'nav.update', meta: { now: 100 } }
    ))).to.eql(['nav.search'])
  })

  it('lets the user take over from an agent', () => {
    let state = reduce(
      { type: 'nav.select', meta: { now: 100, history: true, agent: 'A' } },
      run('item.load', { now: 200 }))

    expect(selectMostRecentActivity({ activities: state }, 300))
      .to.have.property('agent', 'A')

    state = reducer(state,
      { type: 'nav.search', meta: { now: 300, history: true } })

    expect(selectMostRecentActivity({ activities: state }, 300))
      .not.to.have.property('agent')
  })

  it('dismisses a type', () => {
    let state = reduce(run('a', { items: [] }), run('b', { items: [] }))
    expect(Object.keys(reducer(state, dismiss('a')).past)).to.eql(['b'])
  })

  it('restores live records with items', () => {
    let state = reduce(
      run('a', { now: 200, items: [] }),
      run('b', { now: 900, items: [] }),
      run('c', { now: 900 }))
    let action = { ...restore(state), meta: { now: 500 + DAY } }
    expect(Object.keys(reducer(undefined, action).past)).to.eql(['b'])
  })

  it('restores ids negative, keeps busy activities', () => {
    let state = reduce(run('a', { items: [] }))
    let current = { busy: { 7: { id: 7 } }, past: {} }
    let action = { ...restore(state), meta: { now: 300 } }

    let restored = reducer(current, action)
    expect(restored.past.a).to.have.property('id', -1)
    expect(restored.busy).to.equal(current.busy)

    // Restored again, the id stays.
    action = { ...restore(restored), meta: { now: 300 } }
    expect(reducer(current, action).past.a).to.have.property('id', -1)
  })

  it('selects the activity of a view: the busy one, else the past one', () => {
    let busy = { id: 9, type: 'a' }
    let past = { id: 5, type: 'a' }
    let state = { activities: { busy: { 9: busy }, past: { a: past } } }

    expect(selectActivity(state, { type: 'a', id: 9 })).to.equal(busy)
    // Done, or replaced by a newer activity: the past one of the type.
    expect(selectActivity(state, { type: 'a', id: 8 })).to.equal(past)
    expect(selectActivity(state, { type: 'a', id: null })).to.equal(past)
    expect(selectActivity(state, { type: 'b', id: 9 })).to.be.null
  })

  it('selects live records', () => {
    let activities = reduce(
      run('a', { now: 100, items: [1] }),
      run('b', { now: 500, items: [] }),
      run('c', { now: 600, agent: 'A', history: 'add' }))

    expect(selectPastActivities({ activities }, 50 + DAY)
      .map(rec => rec.type)).to.eql(['b', 'a'])
    expect(selectPastActivities({ activities }, 150 + DAY)
      .map(rec => rec.type)).to.eql(['b'])

    // The record shown stays, also if expired.
    let nav = { search: { view: { name: 'activity', type: 'a' } } }
    expect(selectPastActivities({ activities, nav }, 150 + DAY)
      .map(rec => rec.type)).to.eql(['b', 'a'])

    expect(selectMostRecentActivity({ activities }, 550 + DAY).type)
      .to.equal('c')
    expect(selectMostRecentActivity({ activities }, 650 + DAY)).to.be.null
  })
})
