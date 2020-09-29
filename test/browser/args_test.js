import * as args from '../../src/browser/args'

describe('args', () => {
  describe('--env', () => {
    it('falls back to node env', () => {
      expect(args.parse([]).opts)
        .to.have.property('env', process.env.NODE_ENV)
    })

    it('sets environment', () => {
      expect(args.parse(['--env', 'development']).opts)
        .to.have.property('env', 'development')
    })
  })
})
