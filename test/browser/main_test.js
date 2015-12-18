'use strict'

describe('main process', function () {
  const args = __require('browser/args')
  const argv = process.argv

  before(() => {
    sinon.spy(args, 'parse')
    process.argv = ['electron']
  })

  after(() => {
    process.argv = argv
    args.parse.restore()
  })

  describe('when required', function () {
    before(() => __require('browser/main'))

    it('parses cli arguments', function () {
      expect(args.parse).to.have.been.calledOnce
    })
  })

})
