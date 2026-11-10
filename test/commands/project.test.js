import { join, normalize } from 'node:path'
import { stat } from 'node:fs/promises'
import { run } from '../support/saga.js'
import { Check, Optimize, Prune as ProjectPrune, Reindex } from '#tropy/commands/project.js'
import { list } from '#tropy/common/project.js'
import { ls } from '#tropy/common/fs.js'
import { pMap } from '#tropy/common/util.js'
import { Store } from '#tropy/asset/store.js'
import { Prune } from '#tropy/commands/cache.js'
import { Database } from '#tropy/common/db.js'
import { CodeError, IntegrityError } from '#tropy/common/error.js'
import act from '#tropy/actions/project.js'

describe('project commands', () => {
  // A real database object: calls to missing methods fail.
  let db = new Database(':memory:')
  let ro = new Database(':memory:', 'r')
  let corrupt = () => { throw new IntegrityError(['t[1] -> p#0']) }
  let busy = () => { throw new CodeError('SQLITE_BUSY', 'database is locked') }

  after(() => Promise.all([db.close(), ro.close()]))

  let exec = (Cmd, action, { warnings = [], check, free = 0, readOnly } = {}) =>
    run(new Cmd(action, { db: readOnly ? ro : db }).exec(), {
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
        .to.eql([null, { integrity: 'quick' }])
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

    it('skips read-only projects', () => {
      let res = exec(Optimize, act.optimize(null, { force: true }), { readOnly: true })
      expect(res.calls(ro.seq).callCount()).to.equal(0)
    })
  })

  describe('Reindex', () => {
    it('reindexes, then checks', () => {
      let res = exec(Reindex, act.reindex())

      expect(res.calls(db.seq).callCount()).to.equal(1)
      expect(res.calls(db.check).callCount()).to.equal(1)
      expect(res.result).to.be.true
    })

    it('clears the corrupted warning when repaired', () => {
      let res = exec(Reindex, act.reindex(), { warnings: ['newer', 'corrupted'] })
      expect(res.puts[0].payload).to.eql({ warnings: ['newer'] })
    })

    it('keeps the corrupted warning when not repaired', () => {
      let res = exec(Reindex, act.reindex(), {
        warnings: ['corrupted'],
        check: corrupt
      })

      expect(res.result).to.be.false
      expect(res.puts).to.eql([])
    })

    it('skips read-only projects', () => {
      let res = exec(Reindex, act.reindex(), { readOnly: true })
      expect(res.calls(ro.seq).callCount()).to.equal(0)
    })
  })
})

describe('project prune', () => {
  // Native separators: the store normalizes its root (e.g. on Windows).
  let path = normalize('/p/x.tropy')
  let store = join(path, 'assets')
  let a = `${'a'.repeat(32)}.jpg`
  let b = `${'b'.repeat(32)}.png`
  let c = `${'c'.repeat(32)}.tif`

  // Files in the store (name -> mtime) and the referenced names.
  let prune = ({
    files,
    referenced = [],
    project = {},
    root = store,
    prompt = false,
    cancel = false
  }) => {
    let removed = []
    let options = { db: null, store: new Store(root) }

    let res = run(new ProjectPrune(act.prune(null, { prompt }), options).exec(), {
      state: {
        project: { isManaged: true, path, store, ...project }
      },
      mocks: [
        [list, () => new Set(referenced.map(name => join(store, name)))],
        [ls, (dir, { filter }) =>
          Object.keys(files)
            .filter(name => filter({ name }))
            .map(name => join(dir, name))],
        [stat, (file) => ({ mtimeMs: files[file.slice(store.length + 1)] })],
        [pMap, (orphans) => orphans.map(file => removed.push(file))],
        [ProjectPrune.prototype.showDialog, () => ({ cancel })]
      ]
    })

    return { ...res, removed: removed.map(file => file.slice(store.length + 1)) }
  }

  it('removes unreferenced store files', () => {
    let { removed, result } = prune({ files: { [a]: 0, [b]: 0 }, referenced: [a] })

    expect(removed).to.eql([b])
    expect(result).to.equal(1)
  })

  it('keeps files written since it started', () => {
    expect(prune({ files: { [b]: 0, [c]: Date.now() + 1000 } }).removed)
      .to.eql([b])
  })

  it('keeps files not named like store files', () => {
    let files = {
      '.DS_Store': 0,
      'desktop.ini': 0,
      [`.${b}.icloud`]: 0,
      [`${'d'.repeat(32)}.JPG`]: 0
    }

    expect(prune({ files }).removed).to.eql([])
  })

  it('keeps the files when the prompt is cancelled', () => {
    let res = prune({ files: { [b]: 0 }, prompt: true, cancel: true })

    expect(res.removed).to.eql([])
    expect(res.result).to.equal(0)
  })

  it('skips read-only projects', () => {
    let res = prune({ files: { [b]: 0 }, project: { isReadOnly: true } })

    expect(res.removed).to.eql([])
    expect(res.calls(ls).callCount()).to.equal(0)
  })

  it('refuses a store outside the project folder', () => {
    let res = prune({ files: { [b]: 0 }, root: path })

    expect(res.removed).to.eql([])
    expect(res.calls(ls).callCount()).to.equal(0)
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
