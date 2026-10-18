import reducer, {
  cancel, done, start, update
} from '#tropy/slices/activities.js'

describe('activities', () => {
  const cmd = (type, meta) => ({
    type,
    meta: { cmd: 'project', seq: 1, now: 100, ...meta }
  })

  const reduce = (...actions) =>
    actions.reduce(reducer, undefined)

  it('starts an activity for each command', () => {
    expect(reduce(cmd('item.import', { cancel: true })))
      .to.eql({
        1: { id: 1, type: 'item.import', init: 100, cancel: true }
      })
  })

  it('starts activities flagged as such', () => {
    let action = start('test', { hidden: true, statusIcon: 'Status' })
    action.meta = { ...action.meta, seq: 1, now: 100 }

    expect(reduce(action)).to.eql({
      1: { id: 1, type: 'test', init: 100, hidden: true, statusIcon: 'Status' }
    })
    expect(reduce(action, done(action))).to.eql({})
  })

  it('ignores actions which are not commands', () => {
    expect(reduce({ type: 'test', meta: { seq: 1, now: 100 } }))
      .to.eql({})
  })

  it('updates activities', () => {
    let action = cmd('item.import')
    expect(reduce(action, update(action, { progress: 1, total: 2 })))
      .to.have.nested.property('1.progress', 1)
  })

  it('removes activities when their command is done', () => {
    let action = cmd('item.import')
    expect(reduce(action, done(action, {}))).to.eql({})
  })

  it('removes failed activities', () => {
    let action = cmd('item.import')
    expect(reduce(action, done(action, new Error('failed')))).to.eql({})
  })

  it('does not change activities on cancel', () => {
    let action = cmd('item.import')
    let state = reduce(action)
    expect(reducer(state, cancel(1))).to.equal(state)
  })

  it('provides matchers for starting and finishing activities', () => {
    let action = cmd('item.import')
    let handle = start('test')

    expect(start.match(action)).to.be.true
    expect(start.match(handle)).to.be.true
    expect(start.match(done(action))).to.be.false
    expect(start.match({ type: 'test' })).to.be.false

    expect(done.match(done(action))).to.be.true
    expect(done.match(action)).to.be.false
  })
})
