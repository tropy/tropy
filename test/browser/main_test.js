'use strict'

const { app } = require('electron')
const { EventEmitter } = require('events')

describe('main process', () => {
  const Tropy = __require('browser/tropy')
  const tropy = Tropy.instance

  const args = __require('browser/args')
  const argv = process.argv

  before(() => {
    process.argv = ['tropy', 'file.tpy']
    sinon.stub(process, 'on').returns(process)
    sinon.spy(args, 'parse')
    sinon.spy(app, 'whenReady')
    sinon.spy(app, 'setName')
    sinon.stub(app, 'on').returns(app)
    Tropy.instance = sinon.createStubInstance(EventEmitter)
    Tropy.instance.start = sinon.stub().returns(Promise.resolve())
    Tropy.instance.open = sinon.stub()
  })

  after(() => {
    Tropy.instance = tropy
    process.argv = argv
    process.on.restore()
    args.parse.restore()
    app.on.restore()
    app.whenReady.restore()
    app.setName.restore()
  })

  describe('when required', () => {
    before(() => __require('browser/main'))

    it('parses cli arguments', () => {
      expect(args.parse).to.have.been.calledOnce
    })

    it('sets the app name', () => {
      expect(app.setName).to.have.been.called
    })

    it('waits for app "ready"', () => {
      expect(app.whenReady).to.have.been.called
    })

    it('starts Tropy instance', () => {
      expect(Tropy.instance.start).to.have.been.calledOnce
      expect(Tropy.instance.open).to.have.been.calledOnceWith('file.tpy')
      expect(Tropy.instance.isReady).to.be.true
    })

    it('handles uncaught errors', () => {
      expect(process.on).to.have.been.calledWith('uncaughtException')
      expect(process.on).to.have.been.calledWith('unhandledRejection')
    })
  })
})
