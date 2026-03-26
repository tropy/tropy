import { mock } from 'node:test'
import { app } from 'electron'
import { Tropy } from '#tropy/main/tropy.js'
import { qualified } from '#tropy/common/release.js'

describe('main process', () => {
  const tropy = Tropy.instance
  const argv = process.argv
  const env = process.env.NODE_ENV

  let mocks = {}

  before(() => {
    process.argv = ['tropy', 'file.tpy']
    mocks.processOn = mock.method(process, 'on', () => process)
    mocks.setPath = mock.method(app, 'setPath')
    mocks.setProtocol = mock.method(app, 'setAsDefaultProtocolClient')
    mocks.lock = mock.method(app, 'requestSingleInstanceLock', () => true)
    mocks.appOn = mock.method(app, 'on', (type, cb) => {
      if (type === 'ready') cb()
      return app
    })

    Tropy.instance = {
      start: mock.fn(async () => {}),
      open: mock.fn(),
      on: mock.fn()
    }
  })

  after(() => {
    Tropy.instance = tropy
    process.argv = argv
    process.env.NODE_ENV = env
    for (let m of Object.values(mocks)) m.mock.restore()
  })

  describe('when required', () => {
    before(() => import('#tropy/main/index.js'))

    it('sets the app name', () => {
      expect(app.name).to.equal(qualified.product)
    })

    it('sets the data paths', () => {
      let paths = mocks.setPath.mock.calls.map(c => c.arguments[0])
      expect(paths).to.include('userData')
      expect(paths).to.include('userCache')
      expect(paths).to.include('logs')
    })

    it('requests single instance lock', () => {
      expect(mocks.lock.mock.callCount()).to.be.greaterThan(0)
    })

    it('waits for app "ready"', () => {
      let events = mocks.appOn.mock.calls.map(c => c.arguments[0])
      expect(events).to.include('ready')
    })

    it('starts Tropy instance', () => {
      expect(Tropy.instance.start.mock.callCount()).to.equal(1)
      expect(Tropy.instance.ready).to.be.ok
      expect(Tropy.instance.open.mock.callCount()).to.equal(1)
    })

    it('handles uncaught errors', () => {
      let events = mocks.processOn.mock.calls.map(c => c.arguments[0])
      expect(events).to.include('uncaughtException')
      expect(events).to.include('unhandledRejection')
    })
  })
})
