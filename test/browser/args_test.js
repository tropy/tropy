'use strict'

describe('args', () => {
  const args = __require('browser/args')

  describe('--mode', () => {

    beforeEach(() => {
      sinon.stub(console, 'error')
      sinon.stub(process, 'exit')
    })

    afterEach(() => {
      console.error.restore()
      process.exit.restore()
    })

    it('falls back to node env', () => {
      expect(args.parse([])).to.have.property('mode', process.env.NODE_ENV)
    })

    it('sets mode', () => {
      expect(args.parse(['-m', 'dev'])).to.have.property('mode', 'dev')
    })

    it('rejects invalid mode', () => {
      args.parse(['-m', 'foo'])
      expect(process.exit).to.have.been.calledWith(1)
      expect(console.error).to.have.been.called
    })
  })
})
