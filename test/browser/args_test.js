'use strict'

describe('args', () => {
  const args = __require('browser/args')

  describe('--environment', () => {

    beforeEach(() => {
      sinon.stub(console, 'error')
      sinon.stub(process, 'exit')
    })

    afterEach(() => {
      console.error.restore()
      process.exit.restore()
    })

    it('falls back to node env', () => {
      expect(args.parse([]))
        .to.have.property('environment', process.env.NODE_ENV)
    })

    it('sets environment', () => {
      expect(args.parse(['-e', 'development']))
        .to.have.property('environment', 'development')
    })

    it('rejects invalid environment', () => {
      args.parse(['-e', 'foo'])
      expect(process.exit).to.have.been.calledWith(1)
      expect(console.error).to.have.been.called
    })
  })
})
