'use strict'

const { app } = require('electron')
const { EventEmitter } = require('events')

describe('main process', () => {
  const Tropy = __require('browser/tropy')
  const tropy = Tropy.instance

  const args = __require('browser/args')
  const argv = process.argv

  before(() => {
    sinon.spy(args, 'parse')

    sinon.stub(app, 'once').returns(app)
    sinon.stub(app, 'on').returns(app)

    Tropy.instance = sinon.createStubInstance(EventEmitter)

    Tropy.instance.listen = sinon.stub()
    Tropy.instance.restore = sinon.stub()

    process.argv = ['electron']
  })

  after(() => {
    Tropy.instance = tropy
    process.argv = argv

    args.parse.restore()

    app.once.restore()
    app.on.restore()

  })

  describe('when required', () => {
    before(() => __require('browser/main'))

    it('parses cli arguments', () => {
      expect(args.parse).to.have.been.calledOnce
    })

    it('registers event listeners', () => {
      expect(app.once).to.have.been.calledWith('ready')
      expect(Tropy.instance.listen).to.have.been.calledOnce
    })

    it('restores state', () => {
      expect(Tropy.instance.restore).to.have.been.calledOnce
    })
  })

})
