import reducer, {
  cancel, resume, start, stop, suspend, update
} from '#tropy/slices/activities.js'
import { done } from '#tropy/slices/cmd.js'

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

  const reduce = (...actions) =>
    actions.reduce(reducer, undefined)

  it('starts activities for commands explicitly', () => {
    let action = cmd('item.import', { cancel: true })

    expect(reduce(action)).to.eql({})
    expect(reduce(action, started(action)))
      .to.eql({
        1: { id: 1, type: 'item.import', due: 500, cancel: true }
      })
  })

  it('updates activities', () => {
    let action = cmd('item.import')
    expect(reduce(started(action), update(action, { progress: 1, total: 2 })))
      .to.have.nested.property('1.progress', 1)
    expect(reduce(update(action, { progress: 1 }))).to.eql({})
  })

  it('postpones activities suspended before they are due', () => {
    let action = cmd('item.import')
    let at = (now, a) => ({ ...a, meta: { ...a.meta, now } })

    let state = reduce(started(action), at(200, suspend(action)))
    expect(state).to.have.nested.property('1.suspended', 200)

    state = reducer(state, at(1000, resume(action)))
    expect(state[1]).to.not.have.property('suspended')
    expect(state[1]).to.have.property('due', 1300)
  })

  it('does not postpone activities suspended after they are due', () => {
    let action = cmd('item.import')
    let at = (now, a) => ({ ...a, meta: { ...a.meta, now } })

    let state = reduce(
      started(action),
      at(600, suspend(action)),
      at(1000, resume(action)))
    expect(state).to.have.nested.property('1.due', 500)
  })

  it('removes activities when their command is done', () => {
    let action = cmd('item.import')
    expect(reduce(started(action), done(action, {}))).to.eql({})
  })

  it('removes failed activities', () => {
    let action = cmd('item.import')
    expect(reduce(started(action), done(action, new Error('failed')))).to.eql({})
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
})
