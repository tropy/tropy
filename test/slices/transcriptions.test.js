import { nested } from '#tropy/slices/transcriptions.js'

describe('transcriptions (nested)', () => {
  let state = { 1: { id: 1, transcriptions: [] } }
  let done = { done: true }

  it('adds created transcriptions to their parents', () => {
    expect(nested.create(state, {
      payload: { 2: { id: 2, parent: 1 } },
      meta: done
    })).to.have.nested.property('1.transcriptions[0]', 2)
  })

  it('ignores cancelled creates (done without payload)', () => {
    expect(nested.create(state, { meta: done })).to.equal(state)
  })
})
