import { run } from '../support/saga.js'
import { Check, Optimize, Reindex } from '#tropy/commands/project.js'
import { Prune } from '#tropy/commands/cache.js'
import { Database } from '#tropy/common/db.js'
import { CodeError, IntegrityError } from '#tropy/common/error.js'
import act from '#tropy/actions/project.js'

describe('project commands', () => {
  // A real database object: calls to missing methods fail.
  let db = new Database(':memory:')
  let corrupt = () => { throw new IntegrityError(['t[1] -> p#0']) }
  let busy = () => { throw new CodeError('SQLITE_BUSY', 'database is locked') }

  after(() => db.close())

  let exec = (Cmd, action, { warnings = [], check, free = 0 } = {}) =>
    run(new Cmd(action, { db }).exec(), {
      state: { project: { warnings } },
      mocks: [
        [db.check, check],
        [db.free, () => free]
      ]
    })

  describe('Check', () => {
    it('passes', () => {
      let res = exec(Check, act.check(null, { quick: true }))

      expect(res.result).to.be.true
      expect(res.calls(db.check).calls[0].arguments)
        .to.eql([null, { quick: true }])
    })

    it('adds the corrupted warning when it fails', () => {
      let res = exec(Check, act.check(), { warnings: ['newer'], check: corrupt })

      expect(res.result).to.be.false
      expect(res.puts[0].payload).to.eql({ warnings: ['newer', 'corrupted'] })
    })

    it('does not mark other errors as corrupted', () => {
      let res = exec(Check, act.check(), { check: busy })

      expect(res.result).to.be.false
      expect(res.puts).to.eql([])
    })

    it('skips a corrupted project', () => {
      let res = exec(Check, act.check(), { warnings: ['corrupted'] })

      expect(res.result).to.be.false
      expect(res.calls(db.check).callCount()).to.equal(0)
    })
  })

  describe('Optimize', () => {
    let optimized = (res) => res.calls(db.seq).callCount() === 1

    it('optimizes when a fifth of the pages are free', () => {
      expect(optimized(exec(Optimize, act.optimize(), { free: 0.2 }))).to.be.true
      expect(optimized(exec(Optimize, act.optimize(), { free: 0.19 }))).to.be.false
    })

    it('ignores free pages when forced', () => {
      expect(optimized(exec(Optimize, act.optimize(null, { force: true }))))
        .to.be.true
    })

    it('never optimizes a corrupted project', () => {
      let force = act.optimize(null, { force: true })

      expect(optimized(exec(Optimize, force, { warnings: ['corrupted'] })))
        .to.be.false
      expect(optimized(exec(Optimize, force, { check: corrupt })))
        .to.be.false
    })
  })

  describe('Reindex', () => {
    it('reindexes', () => {
      expect(exec(Reindex, act.reindex()).calls(db.seq).callCount())
        .to.equal(1)
    })
  })
})

describe('cache prune', () => {
  let state = { photos: { 1: {} }, selections: { 3: {} } }

  it('keeps the files of photos and selections', () => {
    expect(Prune.check('1_48.webp', state)).to.be.false
    expect(Prune.check('3_512.webp', state)).to.be.false
  })

  it('removes orphans and foreign files', () => {
    expect(Prune.check('2_48.webp', state)).to.be.true
    expect(Prune.check('1_48.png', state)).to.be.true
  })
})
