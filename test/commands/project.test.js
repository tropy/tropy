import { run } from '../support/saga.js'
import { Optimize } from '#tropy/commands/project.js'
import { PROJECT } from '#tropy/constants/index.js'

describe('Optimize', () => {
  let db = { check () {}, clear () {}, seq () {} }
  let optimize = () => new Optimize({ meta: {} }, { db }).exec()

  it('optimizes after a passing check', () => {
    let { calls } = run(optimize())
    expect(calls(db.seq).callCount()).to.equal(1)
  })

  it('warns and does not optimize a corrupted file', () => {
    let gen = optimize()
    gen.next()

    let error = new Error('1 integrity check(s) failed')
    let { value } = gen.throw(error)

    expect(value.payload.action)
      .to.include({ type: PROJECT.WARN, payload: 'corrupted' })
    expect(() => gen.next()).to.throw(error)
  })
})
