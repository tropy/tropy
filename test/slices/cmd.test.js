import * as cmd from '#tropy/slices/cmd.js'

describe('command lifecycle matchers', () => {
  let request = { type: 'a', payload: 1, meta: { cmd: 'project', seq: 1 } }
  let fulfilled = cmd.done(request, 2)
  let rejected = cmd.done(request, new Error())
  let other = { type: 'b', payload: 1, meta: {} }

  let matching = (matcher) =>
    [request, fulfilled, rejected, other].filter(matcher)

  it('match each phase of a command', () => {
    expect(matching(cmd.isPending())).to.eql([request])
    expect(matching(cmd.isDone())).to.eql([fulfilled])
    expect(matching(cmd.hasFailed())).to.eql([rejected])
  })

  it('match the result of one request', () => {
    let next = { ...request, meta: { ...request.meta, seq: 2 } }

    expect(matching(cmd.isResultOf(request))).to.eql([fulfilled, rejected])
    expect(matching(cmd.isResultOf(next))).to.eql([])
  })

  it('match only the given types', () => {
    expect(matching(cmd.isDone('a', 'c'))).to.eql([fulfilled])
    expect(matching(cmd.isDone('c'))).to.eql([])
  })
})
