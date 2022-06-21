import { app } from 'electron'
import { EventEmitter } from 'events'
import { Tropy } from '../../src/browser/tropy'
import * as args from '../../src/browser/args'
import { qualified } from '../../src/common/release'

describe('main process', () => {
  const tropy = Tropy.instance

  const argv = process.argv
  const env = process.env.NODE_ENV


  before(() => {
    process.argv = ['tropy', 'file.tpy']
    sinon.stub(process, 'on').returns(process)
    sinon.spy(args, 'parse')
    sinon.stub(app, 'setPath')
    sinon.stub(app, 'setAsDefaultProtocolClient')
    sinon.stub(app, 'requestSingleInstanceLock').returns(true)
    sinon.stub(app, 'on').callsFake((type, cb) => {
      if (type === 'ready') cb()
      return app
    })
    Tropy.instance = sinon.createStubInstance(EventEmitter)
    Tropy.instance.start = sinon.stub().returns(Promise.resolve())
    Tropy.instance.open = sinon.stub()
  })

  after(() => {
    Tropy.instance = tropy
    process.argv = argv
    process.env.NODE_ENV = env
    process.on.restore()
    args.parse.restore()
    app.on.restore()
    app.requestSingleInstanceLock.restore()
    app.setAsDefaultProtocolClient.restore()
    app.setPath.restore()
  })

  describe('when required', () => {
    before(
      async () => { await import('../../src/browser/main') }
    )

    it('parses cli arguments', () => {
      expect(args.parse).to.have.been.calledOnce
    })

    it('sets the app name', () => {
      expect(app.name).to.equal(qualified.product)
    })

    it('sets the data paths', () => {
      expect(app.setPath)
        .to.have.been.calledWith('userData')
        .and.to.have.been.calledWith('userCache')
        .and.to.have.been.calledWith('logs')
    })

    it('requests single instance lock', () => {
      expect(app.requestSingleInstanceLock).to.have.been.called
    })

    it('waits for app "ready"', () => {
      expect(app.on).to.have.been.calledWith('ready')
    })

    it('starts Tropy instance', () => {
      expect(Tropy.instance.start).to.have.been.calledOnce
      expect(Tropy.instance.ready).to.be.ok
      expect(Tropy.instance.open)
        .to.have.been.calledOnce
    })

    it('handles uncaught errors', () => {
      expect(process.on).to.have.been.calledWith('uncaughtException')
      expect(process.on).to.have.been.calledWith('unhandledRejection')
    })
  })
})
