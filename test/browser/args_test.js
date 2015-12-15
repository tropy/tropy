'use strict'

describe('args', () => {
  const args = __require('browser/args')

  describe('--mode', () => {

    it('falls back to node env', () => {
      expect(args.parse([])).to.have.property('mode', process.env.NODE_ENV)
    })

    it('sets mode', () => {
      expect(args.parse(['-m', 'dev'])).to.have.property('mode', 'dev')
    })

  })
})
