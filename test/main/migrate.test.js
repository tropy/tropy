import { mock } from 'node:test'
import { MIGRATIONS, migrate } from '#tropy/main/migrate.js'
import { version } from '#tropy/common/release.js'

describe('migrate', () => {
  describe('MIGRATIONS', () => {
    it('has known migrations in order', () => {
      expect(MIGRATIONS.map(m => m.name)).to.eql([
        'local-storage',
        'user-cache',
        'win32-custom-titlebar',
        'api-default-port'
      ])
    })
  })

  describe('win32-custom-titlebar', () => {
    let migration = MIGRATIONS.find(m => m.name === 'win32-custom-titlebar')

    it('sets frameless to true on win32', async () => {
      let state = { frameless: false }
      await migration.up({}, state)
      expect(state.frameless).to.be.equal(process.platform === 'win32')
    })
  })

  describe('migrate()', () => {
    const called = () =>
      MIGRATIONS.filter(m => m.up.mock.callCount() > 0)

    beforeEach(() => {
      for (let m of MIGRATIONS)
        mock.method(m, 'up', async () => {})
    })

    afterEach(() => {
      for (let m of MIGRATIONS)
        m.up.mock.restore()
    })

    it('runs all migrations for very old versions', async () => {
      await migrate({ version: '1.0.1' }, {})
      expect(called()).to.eql(MIGRATIONS)
    })

    it('skips all migrations for the current version', async () => {
      await migrate({ version }, {})
      expect(called()).to.be.empty
    })

    it('only runs migrations newer than the given version', async () => {
      await migrate({ version: '1.14.3' }, {})
      expect(called().map(m => m.name)).to.eql([
        'win32-custom-titlebar',
        'api-default-port'
      ])
    })

    it('continues after a migration failure', async () => {
      MIGRATIONS[0].up.mock.mockImplementation(() => {
        throw new Error('fail')
      })
      await migrate({ version: '1.0.0' }, {})
      expect(called()).to.eql(MIGRATIONS)
    })
  })
})
