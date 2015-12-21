'use strict'

describe('main process', function () {
  const { app } = require('electron')
  const args = __require('browser/args')
  const argv = process.argv

  before(() => {
    sinon.spy(args, 'parse')
    sinon.spy(app, 'once')
    process.argv = ['electron']
  })

  after(() => {
    process.argv = argv
    args.parse.restore()
    app.once.restore()
  })

  describe('when required', function () {
    before(() => __require('browser/main'))

    it('parses cli arguments', function () {
      expect(args.parse).to.have.been.calledOnce
    })

    it('listens for app:ready', function () {
      expect(app.once).to.have.been.calledWith('ready')
    })
  })

})
